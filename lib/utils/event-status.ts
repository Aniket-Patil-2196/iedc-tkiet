import { IEvent } from "@/types/content";

export type EventLifecycleStatus =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "postponed"
  | "cancelled";

export type EventRegistrationStatus =
  | "open"
  | "closed"
  | "sold-out"
  | "external"
  | "none";

export interface EventStatusResult {
  lifecycle: EventLifecycleStatus;
  registration: EventRegistrationStatus;
}

export interface ResolvedEventStatus {
  label: string;
  isOverride: boolean;
  canRegister: boolean;
  badgeClass: string;
  dotClass: string;
}

export type RegistrationAction =
  | {
      type: "external";
      url: string;
      label: string;
      disabled?: false;
    }
  | {
      type: "onsite";
      label: string;
      disabled?: false;
    }
  | {
      type: "disabled";
      label: string;
      reason?: string;
      disabled: true;
    };

/**
 * Checks whether an event is development placeholder data.
 */
export function isDevelopmentPlaceholder(event?: {
  id?: string;
  title?: string;
  slug?: string;
} | null): boolean {
  if (!event) return false;
  if (event.id?.startsWith("evt-placeholder")) return true;
  if (event.id?.includes("placeholder")) return true;
  if (event.slug?.includes("placeholder")) return true;
  if (event.title?.includes("[Development Placeholder]")) return true;
  return false;
}

/**
 * Checks whether online payments and on-site event registrations are enabled.
 * Controlled by the PAYMENTS_ENABLED env flag (default: false).
 */
export function isPaymentsEnabled(): boolean {
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true") return true;
    if (process.env.PAYMENTS_ENABLED === "true") return true;
  }
  return false;
}

/**
 * Resolves the explicit registration architecture for an event.
 * Saved mode takes precedence; if absent, defaults to "external" ONLY if registrationUrl exists; else "none".
 */
export function resolveRegistrationMode(
  event?: Partial<IEvent> | null
): "external" | "onsite" | "none" {
  if (!event) return "none";

  const mode = event.registrationMode;
  if (mode === "external" || mode === "onsite" || mode === "none") {
    return mode;
  }

  // Legacy fallback: external only if URL exists, else none
  if (
    event.registrationUrl?.trim() ||
    event.registrationLink?.trim()
  ) {
    return "external";
  }

  return "none";
}

/**
 * Validates whether an event has a parseable, non-NaN start date.
 */
export function isEventDateValid(event?: Partial<IEvent> | null): boolean {
  if (!event) return false;
  const rawDate = event.startDate || event.date;
  if (!rawDate || !rawDate.trim()) return false;
  const parsed = getEventDateUtc(rawDate, event.startTime);
  return Boolean(parsed && !Number.isNaN(parsed.getTime()));
}

/**
 * Combines date and time string into a valid UTC Date object in IST (+05:30).
 * Handles ISO strings with timezone, raw date strings (YYYY-MM-DD), and 12h/24h time strings.
 */
export function getEventDateUtc(
  dateStr?: string | null,
  timeStr?: string | null
): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();

  // If already full ISO with timezone (ends with Z or has +XX:XX offset)
  if (
    trimmed.endsWith("Z") ||
    trimmed.includes("+") ||
    (trimmed.includes("T") && trimmed.lastIndexOf("-") > 8)
  ) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Extract YYYY-MM-DD
  const dateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  const ymd = dateMatch[1];

  let timePart = "00:00:00";
  if (timeStr && timeStr.trim()) {
    const t = timeStr.trim();
    const ampmMatch = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3]?.toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      timePart = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    } else {
      const match24 = t.match(/(\d{1,2}):(\d{2})/);
      if (match24) {
        timePart = `${match24[1].padStart(2, "0")}:${match24[2].padStart(2, "0")}:00`;
      }
    }
  } else if (trimmed.includes("T")) {
    const t = trimmed.split("T")[1]?.replace(/Z|[\+\-].*$/, "");
    if (t) {
      timePart = t.length === 5 ? `${t}:00` : t.slice(0, 8);
    }
  }

  // Formulate explicitly in Indian Standard Time (UTC+05:30)
  const istIso = `${ymd}T${timePart}+05:30`;
  const d = new Date(istIso);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Computes event lifecycle and registration status.
 *
 * @param event The event record
 * @param paidCount Aggregated count of confirmed/paid registrations (server-computed)
 * @param now Reference timestamp (defaults to current time)
 */
export function getEventStatus(
  event: Partial<IEvent> & { _id?: any },
  paidCount: number = 0,
  now: Date = new Date()
): EventStatusResult {
  const start = getEventDateUtc(event.startDate || event.date, event.startTime);
  const hasTimeSpecified = Boolean(
    event.startTime?.trim() ||
      (event.startDate && event.startDate.includes("T") && !event.startDate.endsWith("T00:00:00.000Z"))
  );

  let end = getEventDateUtc(event.endDate, event.endTime);
  if (!end && start && !Number.isNaN(start.getTime())) {
    if (!hasTimeSpecified) {
      // Event date with no time: spans until the end of that day in IST (23:59:59.999+05:30)
      const rawDateStr = event.startDate || event.date || "";
      const dateMatch = rawDateStr.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const endOfDayIst = new Date(`${dateMatch[1]}T23:59:59.999+05:30`);
        end = !Number.isNaN(endOfDayIst.getTime()) ? endOfDayIst : new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
      } else {
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
      }
    } else {
      // Default 4-hour window for timed events
      end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    }
  }

  // 1. Determine lifecycle
  let lifecycle: EventLifecycleStatus = "upcoming";

  if (event.statusOverride) {
    const ov = event.statusOverride;
    if (ov === "Cancelled") lifecycle = "cancelled";
    else if (ov === "Postponed") lifecycle = "postponed";
    else if (ov === "Completed") lifecycle = "completed";
    else if (ov === "Ongoing") lifecycle = "ongoing";
    else if (ov === "Upcoming") lifecycle = "upcoming";
    else if (ov === "Registration Open") {
      if (start && !Number.isNaN(start.getTime()) && now >= start && (!end || now <= end)) {
        lifecycle = "ongoing";
      } else {
        lifecycle = "upcoming";
      }
    } else {
      // "Registration Closed" - infer lifecycle from dates
      if (start && !Number.isNaN(start.getTime())) {
        if (now < start) lifecycle = "upcoming";
        else if (end && now > end) lifecycle = "completed";
        else lifecycle = "ongoing";
      }
    }
  } else {
    if (start && !Number.isNaN(start.getTime())) {
      if (now < start) {
        lifecycle = "upcoming";
      } else if (end && now > end) {
        lifecycle = "completed";
      } else {
        lifecycle = "ongoing";
      }
    }
  }

  // 2. Resolve explicit registration mode
  const isFallbackOrDev = isDevelopmentPlaceholder(event);
  let mode = resolveRegistrationMode(event);

  // Fallback data must NEVER offer on-site registration
  if (isFallbackOrDev && mode === "onsite") {
    mode = event.registrationUrl?.trim() ? "external" : "none";
  }

  // 3. Registration cut-off calculation:
  // Closes at the EARLIER of registrationDeadline and event start time
  let effectiveCutoff: Date | null = null;
  if (start && !Number.isNaN(start.getTime())) {
    effectiveCutoff = start;
  }
  if (event.registrationDeadline) {
    const deadline = new Date(event.registrationDeadline);
    if (!Number.isNaN(deadline.getTime())) {
      if (!effectiveCutoff || deadline.getTime() < effectiveCutoff.getTime()) {
        effectiveCutoff = deadline;
      }
    }
  }

  const isCutoffReached = Boolean(
    effectiveCutoff && now.getTime() >= effectiveCutoff.getTime()
  );

  const isExplicitlyClosed =
    event.statusOverride === "Registration Closed" || event.registrationOpen === false;

  const isCapacityReached = Boolean(
    mode === "onsite" &&
      event.capacity !== undefined &&
      event.capacity !== null &&
      event.capacity > 0 &&
      paidCount >= event.capacity
  );

  // 4. Determine registration status
  let registration: EventRegistrationStatus = "none";

  if (mode === "none") {
    registration = "none";
  } else if (lifecycle === "cancelled" || lifecycle === "completed") {
    registration = "closed";
  } else if (isExplicitlyClosed || isCutoffReached) {
    registration = "closed";
  } else if (isCapacityReached) {
    registration = "sold-out";
  } else if (mode === "external") {
    registration = "external";
  } else if (mode === "onsite") {
    registration = "open";
  }

  return { lifecycle, registration };
}

/**
 * Shared helper that returns the exact CTA action and label for an event.
 * Reused in Phase 1 (EventFeaturedCard) and Phase 4 (EventRegistrationPanel).
 */
export function getRegistrationAction(
  event: Partial<IEvent> & { _id?: any },
  status: EventStatusResult,
  paymentsEnabledOverride?: boolean
): RegistrationAction {
  if (status.lifecycle === "cancelled") {
    return {
      type: "disabled",
      label: "Event Cancelled",
      reason: "This event has been cancelled by the organizing committee.",
      disabled: true,
    };
  }

  if (status.lifecycle === "postponed") {
    return {
      type: "disabled",
      label: "Event Postponed",
      reason: "This event has been postponed. Updated schedule will be announced.",
      disabled: true,
    };
  }

  if (!isEventDateValid(event)) {
    return {
      type: "disabled",
      label: "Registration Unavailable",
      reason: "Event date is pending confirmation or invalid.",
      disabled: true,
    };
  }

  if (status.lifecycle === "completed") {
    return {
      type: "disabled",
      label: "Event Concluded",
      reason: "This event has concluded.",
      disabled: true,
    };
  }

  if (status.registration === "sold-out") {
    return {
      type: "disabled",
      label: "Sold Out",
      reason: "All available registration seats have been filled.",
      disabled: true,
    };
  }

  if (status.registration === "closed") {
    return {
      type: "disabled",
      label: "Registration Closed",
      reason: "Registrations for this event are currently closed.",
      disabled: true,
    };
  }

  if (status.registration === "none") {
    // "No Registration Required" ONLY when admin explicitly chose mode "none"
    if (event.registrationMode === "none") {
      return {
        type: "disabled",
        label: "No Registration Required",
        reason: "Open attendance / Walk-in entry.",
        disabled: true,
      };
    }
    // For invalid dates, placeholder coercion, missing links, or unavailable states:
    return {
      type: "disabled",
      label: "Registration Unavailable",
      reason: "Registration is currently unavailable for this event.",
      disabled: true,
    };
  }

  if (status.registration === "external") {
    const url = event.registrationUrl || event.registrationLink;
    if (!url || !url.trim()) {
      return {
        type: "disabled",
        label: "Registration Unavailable",
        reason: "External registration link is not configured.",
        disabled: true,
      };
    }
    return {
      type: "external",
      url,
      label: "Register Now",
    };
  }

  if (status.registration === "open") {
    const paymentsActive =
      paymentsEnabledOverride !== undefined
        ? paymentsEnabledOverride
        : isPaymentsEnabled();

    if (!paymentsActive) {
      return {
        type: "disabled",
        label: "Online registration opens soon",
        reason: "Online registration opens soon.",
        disabled: true,
      };
    }

    const feeRupees = event.fee !== undefined && event.fee > 0 ? Math.floor(event.fee) : 0;
    return {
      type: "onsite",
      label: feeRupees > 0 ? `Register Now • ₹${feeRupees}` : "Register for Free",
    };
  }

  return {
    type: "disabled",
    label: "Registration Unavailable",
    reason: "Registration is not available.",
    disabled: true,
  };
}

/**
 * Backwards-compatible status info helper used by existing components.
 */
export function getEventStatusInfo(event: IEvent): ResolvedEventStatus {
  if (event.statusOverride) {
    const override = event.statusOverride;
    switch (override) {
      case "Registration Open":
        return {
          label: "Registration Open",
          isOverride: true,
          canRegister: true,
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          dotClass: "bg-emerald-400 animate-pulse",
        };
      case "Registration Closed":
        return {
          label: "Registration Closed",
          isOverride: true,
          canRegister: false,
          badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dotClass: "bg-amber-400",
        };
      case "Ongoing":
        return {
          label: "Event Ongoing",
          isOverride: true,
          canRegister: false,
          badgeClass: "bg-brand-blue/20 text-brand-cyan border-brand-cyan/40",
          dotClass: "bg-brand-cyan animate-pulse",
        };
      case "Completed":
        return {
          label: "Completed",
          isOverride: true,
          canRegister: false,
          badgeClass: "bg-foundation-slate/60 text-typo-gray border-foundation-slate",
          dotClass: "bg-typo-gray/60",
        };
      case "Postponed":
        return {
          label: "Postponed",
          isOverride: true,
          canRegister: false,
          badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dotClass: "bg-amber-400",
        };
      case "Cancelled":
        return {
          label: "Cancelled",
          isOverride: true,
          canRegister: false,
          badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          dotClass: "bg-rose-400",
        };
      case "Upcoming":
      default:
        return {
          label: "Upcoming",
          isOverride: true,
          canRegister: Boolean(event.registrationUrl || event.registrationLink),
          badgeClass: "bg-brand-blue/20 text-brand-cyan border-brand-blue/40",
          dotClass: "bg-brand-cyan",
        };
    }
  }

  const { lifecycle, registration } = getEventStatus(event);

  if (lifecycle === "ongoing") {
    return {
      label: "Ongoing",
      isOverride: false,
      canRegister: false,
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-400 animate-pulse",
    };
  }

  if (lifecycle === "completed") {
    return {
      label: "Completed",
      isOverride: false,
      canRegister: false,
      badgeClass: "bg-foundation-slate/60 text-typo-gray border-foundation-slate",
      dotClass: "bg-typo-gray/60",
    };
  }

  // Upcoming
  if (registration === "open" || registration === "external") {
    return {
      label: "Registration Open",
      isOverride: false,
      canRegister: true,
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-400 animate-pulse",
    };
  }

  if (registration === "sold-out") {
    return {
      label: "Sold Out",
      isOverride: false,
      canRegister: false,
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-400",
    };
  }

  if (registration === "closed") {
    return {
      label: "Registration Closed",
      isOverride: false,
      canRegister: false,
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-400",
    };
  }

  return {
    label: "Upcoming",
    isOverride: false,
    canRegister: false,
    badgeClass: "bg-brand-blue/20 text-brand-cyan border-brand-blue/40",
    dotClass: "bg-brand-cyan",
  };
}

/**
 * Formats event date in student-friendly format (e.g., "15 Apr 2025")
 */
export function formatEventDate(isoDateString?: string | Date): string {
  if (!isoDateString) return "Date to be announced";
  const d = typeof isoDateString === "string" ? new Date(isoDateString) : isoDateString;
  if (isNaN(d.getTime())) return String(isoDateString);

  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats time range (e.g. "10:00 AM – 1:00 PM")
 */
export function formatEventTimeRange(
  startTime?: string,
  endTime?: string
): string | null {
  if (startTime && endTime) {
    return `${startTime} – ${endTime}`;
  }
  if (startTime) {
    return startTime;
  }
  return null;
}

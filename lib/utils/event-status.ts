import { IEvent, EventStatus, EventStatusOverride } from "@/types/content";

export interface ResolvedEventStatus {
  label: string;
  isOverride: boolean;
  canRegister: boolean;
  badgeClass: string;
  dotClass: string;
}

/**
 * Computes event status by comparing start/end dates with current time,
 * or resolves the administrator override if present.
 */
export function getEventStatusInfo(event: IEvent): ResolvedEventStatus {
  // If an administrator override is present, it takes precedence
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

  // Automatic calculation based on dates
  const now = new Date();
  const start = new Date(event.startDate || event.date || "");
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 4 * 60 * 60 * 1000); // default 4h window

  if (isNaN(start.getTime())) {
    return {
      label: "Upcoming",
      isOverride: false,
      canRegister: Boolean(event.registrationUrl || event.registrationLink),
      badgeClass: "bg-brand-blue/20 text-brand-cyan border-brand-blue/40",
      dotClass: "bg-brand-cyan",
    };
  }

  if (now < start) {
    return {
      label: "Upcoming",
      isOverride: false,
      canRegister: Boolean(event.registrationUrl || event.registrationLink),
      badgeClass: "bg-brand-blue/20 text-brand-cyan border-brand-blue/40",
      dotClass: "bg-brand-cyan",
    };
  } else if (now >= start && now <= end) {
    return {
      label: "Ongoing",
      isOverride: false,
      canRegister: false,
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-400 animate-pulse",
    };
  } else {
    return {
      label: "Completed",
      isOverride: false,
      canRegister: false,
      badgeClass: "bg-foundation-slate/60 text-typo-gray border-foundation-slate",
      dotClass: "bg-typo-gray/60",
    };
  }
}

/**
 * Formats event date in consistent student-friendly format (e.g., "15 Apr 2025")
 */
export function formatEventDate(isoDateString?: string): string {
  if (!isoDateString) return "Date to be announced";
  const d = new Date(isoDateString);
  if (isNaN(d.getTime())) return isoDateString;

  return d.toLocaleDateString("en-IN", {
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

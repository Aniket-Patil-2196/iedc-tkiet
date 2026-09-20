/**
 * Utilities for handling dates in Indian Standard Time (IST - Asia/Kolkata, UTC+5:30).
 */

const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

/**
 * Converts a datetime-local input value (assumed to be entered in IST) to a UTC Date object.
 * Input format typically: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
 */
export function istInputToUtcDate(istString: string | null | undefined): Date | null {
  if (!istString || !istString.trim()) return null;

  const trimmed = istString.trim();

  // If already contains timezone indicator, parse directly
  if (trimmed.endsWith("Z") || trimmed.includes("+") || trimmed.includes("-", 10)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Parse YYYY-MM-DDTHH:mm(:ss) as IST (+05:30)
  const [datePart, timePart] = trimmed.split("T");
  if (!datePart || !timePart) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  const isoWithIst = `${datePart}T${normalizedTime}+05:30`;
  const d = new Date(isoWithIst);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converts a UTC Date object (or ISO string) to "YYYY-MM-DDTHH:mm" for HTML datetime-local input in IST.
 */
export function utcDateToIstInputString(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  // Shift UTC timestamp by +5:30 to extract IST components via getUTC* methods
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");
  const hours = String(istTime.getUTCHours()).padStart(2, "0");
  const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a date nicely in Indian Standard Time (Asia/Kolkata).
 * Example: "25 Sep 2026, 06:30 PM IST"
 */
export function formatDateIST(
  date: Date | string | null | undefined,
  includeTime = true
): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "N/A";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  };

  const formatted = new Intl.DateTimeFormat("en-IN", options).format(d);
  return includeTime ? `${formatted} IST` : formatted;
}

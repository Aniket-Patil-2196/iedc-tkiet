/**
 * Shared server-side validation for TeamMember fields.
 * Used in both POST and PUT admin API handlers.
 */
export function validateTeamMember(body: any): string | null {
  if (body.linkedinUrl && typeof body.linkedinUrl === "string" && body.linkedinUrl.trim()) {
    const url = body.linkedinUrl.trim();
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (!parsed.hostname.toLowerCase().includes("linkedin.com")) {
        return "LinkedIn URL must be a valid linkedin.com profile URL.";
      }
    } catch {
      return "Invalid LinkedIn URL format.";
    }
  }

  if (body.email && typeof body.email === "string" && body.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return "Please provide a valid email address.";
    }
  }

  return null;
}

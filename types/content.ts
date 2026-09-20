/**
 * Content model interfaces for IEDC TKIET
 * Innovation and Entrepreneurship Development Cell
 * Tatyasaheb Kore Institute of Engineering and Technology
 */

export type EventStatus = "upcoming" | "ongoing" | "completed";

export type EventStatusOverride =
  | "Registration Open"
  | "Registration Closed"
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Postponed"
  | "Cancelled";

export interface IEvent {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  summary?: string; // Compatibility alias with earlier steps
  description: string;
  startDate: string; // ISO date string
  endDate?: string;
  startTime?: string; // e.g., "10:00 AM"
  endTime?: string;   // e.g., "01:00 PM"
  date?: string;      // Compatibility alias with startDate
  venue: string;
  isOnline?: boolean;
  status?: EventStatus;
  statusOverride?: EventStatusOverride | null;
  fee?: number; // Integer rupees (0 = free)
  registrationDeadline?: string | Date; // UTC date
  capacity?: number | null; // Optional max seats
  registrationOpen?: boolean; // Default true
  registrationMode?: "external" | "onsite" | "none";
  registrationUrl?: string;
  registrationLink?: string; // Compatibility alias
  coverImage?: string;
  posterUrl?: string; // Compatibility alias
  featured?: boolean;
  published: boolean;
  category: string;
  highlights?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type RegistrationStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export interface IRegistration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  status: RegistrationStatus;
  amount: number; // in paise
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptNumber?: string;
  receiptToken: string;
  paymentMethod?: string;
  paidAt?: string | Date;
  refundId?: string;
  refundedAt?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface IBlog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown, paragraphs, or rich text representation
  coverImage?: string;
  publicationDate: string; // ISO date string
  publishedAt?: string;    // Compatibility alias
  readTimeMinutes: number;
  author: "IEDC TKIET";    // Fixed institutional author per spec
  published: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type TeamCategory = "faculty_coordinator" | "student_lead" | "core_team" | "advisory";

export interface ITeamMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  category: TeamCategory;
  avatarUrl?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  order: number;
}

export interface IJourneyMilestone {
  id: string;
  year: string;
  title: string;
  summary: string;
  description: string;
  highlightMetric?: string;
  order: number;
  phaseLabel?: string; // e.g., "01 // BEGIN"
  label?: string; // Stage label alias
  planetType?: "embryo" | "oceanic" | "nexus" | "gas_giant" | "radiant";
  accent?: string; // Planet visual theme or color
  status?: "completed" | "active" | "ongoing";
  tagline?: string;
  metric?: string;
  isDevPlaceholder?: boolean;
  published?: boolean;
  detailedStory?: string;
  image?: string;
}

export interface ILeadershipMessage {
  id: string;
  leaderName: string;
  designation: string;
  institution: string; // e.g., Tatyasaheb Kore Institute of Engineering and Technology (TKIET)
  message: string;
  avatarUrl?: string;
  order: number;
}

export interface IAchievement {
  id: string;
  title: string;
  category: string;
  year: string;
  shortDescription?: string;
  description: string;
  recipientOrTeam?: string;
  verifiedLink?: string;
  mediaUrl?: string;
  certificateImage?: string;
  published?: boolean;
  order: number;
}

export interface ICollaboration {
  id: string;
  partnerName: string; // e.g., National Entrepreneurship Challenge (NEC), Institution's Innovation Council (IIC)
  partnerType: string;
  logoUrl?: string;
  description: string;
  websiteUrl?: string;
  order: number;
}

export interface IGalleryImage {
  id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  aspectRatio?: "square" | "wide" | "tall";
  tags?: string[];
  eventRefId?: string;
  published?: boolean;
  order: number;
}

export interface IAboutContent {
  id?: string;
  whoWeAre: string;
  vision: string;
  mission: string;
  updatedAt?: string;
}

export interface IContactSubmission {
  id: string;
  name: string;
  email: string;
  category?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IPreviousSpeaker {
  id: string;
  name: string;
  designation: string;
  organization?: string;
  photo: string;
  shortDescription?: string;
  eventAssociation?: string;
  displayOrder: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IImpactMetric {
  id: string;
  value: string;
  label: string;
  displayOrder: number;
  enabled: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}



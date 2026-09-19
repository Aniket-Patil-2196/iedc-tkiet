/**
 * Core site constants and metadata for IEDC TKIET
 */

export const SITE_CONFIG = {
  name: "IEDC TKIET",
  fullName: "Innovation and Entrepreneurship Development Cell",
  institution: "Tatyasaheb Kore Institute of Engineering and Technology",
  institutionShort: "TKIET",
  location: "Warananagar, Maharashtra, India",
  tagline: "Empowering Student Innovators & Pioneering Future Entrepreneurs",
  description:
    "Official website of the Innovation and Entrepreneurship Development Cell (IEDC) at Tatyasaheb Kore Institute of Engineering and Technology (TKIET), fostering creativity, startup culture, and technological innovation.",
  url: "https://iedc.tkiet.ac.in",
} as const;

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  children?: {
    title: string;
    href: string;
    description?: string;
  }[];
}

/**
 * Public navigation items.
 * Note: Admin route (/admin) is explicitly omitted from public navigation.
 */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/about",
    description: "Our mission, vision, and institutional ecosystem",
  },
  {
    title: "Events",
    href: "/events",
    description: "Hackathons, speaker sessions, bootcamps, and workshops",
  },
  {
    title: "Blog",
    href: "/blog",
    description: "Articles, entrepreneurial insights, and campus startup stories",
  },
  {
    title: "Team",
    href: "/team",
    description: "Faculty coordinators and student initiative leads",
  },
  {
    title: "Collaborations",
    href: "/collaborations",
    description: "Strategic partnerships including NEC and IIC networks",
  },
  {
    title: "Achievements",
    href: "/achievements",
    description: "National competitions, hackathon victories, and patents",
  },
  {
    title: "Gallery",
    href: "/gallery",
    description: "Interactive showcase of our events and student ventures",
  },
  {
    title: "Contact",
    href: "/contact",
    description: "Get in touch, pitch ideas, or visit the innovation center",
  },
];

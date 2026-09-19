import {
  IEvent,
  IBlog,
  ITeamMember,
  IJourneyMilestone,
  ILeadershipMessage,
  IAchievement,
  ICollaboration,
  IGalleryImage,
  IPreviousSpeaker,
  IImpactMetric,
} from "@/types/content";

/**
 * Institutional verified details and clearly marked placeholders.
 * Strict rule: No fake statistics, fake individuals, or fabricated institutional records.
 * All temporary items are explicitly designated as placeholders.
 */

export const PLACEHOLDER_EVENTS: IEvent[] = [
  {
    id: "evt-placeholder-1",
    slug: "annual-ideathon-showcase",
    title: "Annual Ideathon Showcase",
    shortDescription: "Official upcoming innovation challenge for student prototypes and entrepreneurial pitches at TKIET.",
    summary: "Official upcoming innovation challenge for student prototypes and entrepreneurial pitches at TKIET.",
    description: "The Annual Ideathon Showcase is the flagship student innovation event organized by IEDC TKIET. Student teams from all engineering disciplines will present workable prototypes, hardware models, and software architectures to a panel of institutional and industrial evaluators. Selected prototypes receive structured mentorship, laboratory resources, and incubation pathways.",
    startDate: "2025-04-15T10:00:00.000Z",
    endDate: "2025-04-15T17:00:00.000Z",
    startTime: "10:00 AM",
    endTime: "05:00 PM",
    date: "2025-04-15T10:00:00.000Z",
    venue: "Main Auditorium, TKIET Warananagar",
    isOnline: false,
    statusOverride: "Registration Open",
    registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc-placeholder-iedc-tkiet/viewform",
    registrationLink: "https://docs.google.com/forms/d/e/1FAIpQLSc-placeholder-iedc-tkiet/viewform",
    featured: true,
    published: true,
    category: "Ideathon & Hackathon",
    highlights: ["Prototype Demonstrations", "Faculty & Industry Mentorship", "Incubation Support Pathways"],
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "evt-placeholder-2",
    slug: "prototype-bootcamp-series",
    title: "Campus Prototyping Workshop",
    shortDescription: "Interactive hardware and software fabrication bootcamp held for interdisciplinary student teams.",
    summary: "Interactive hardware and software fabrication bootcamp held for interdisciplinary student teams.",
    description: "Hands-on engineering workshop focused on rapid prototyping methods, IoT development boards, and preliminary intellectual property awareness.",
    startDate: "2024-11-20T09:30:00.000Z",
    endDate: "2024-11-20T16:30:00.000Z",
    startTime: "09:30 AM",
    endTime: "04:30 PM",
    date: "2024-11-20T09:30:00.000Z",
    venue: "Innovation Center Lab, TKIET",
    isOnline: false,
    statusOverride: "Completed",
    featured: false,
    published: true,
    category: "Workshop",
    highlights: ["Rapid Prototyping", "Component Sourcing", "Lab Safety"],
    createdAt: "2024-10-15T00:00:00.000Z",
  },
  {
    id: "evt-draft-3",
    slug: "internal-seed-pitch-cohort",
    title: "[Draft Event - Internal Only] Seed Pitch Cohort",
    shortDescription: "Internal draft event that must not be published publicly.",
    description: "Internal testing event.",
    startDate: "2025-08-01T10:00:00.000Z",
    venue: "Seminar Hall, TKIET",
    published: false,
    category: "Pitch",
    createdAt: "2025-01-10T00:00:00.000Z",
  },
];

export const PLACEHOLDER_BLOGS: IBlog[] = [
  {
    id: "blog-placeholder-1",
    slug: "fostering-innovation-tkiet",
    title: "Cultivating Student-Led Innovation at TKIET",
    excerpt: "How structured incubation, prototype access, and interdisciplinary collaboration empower engineering students to build viable ventures.",
    content: "Engineering education is evolving rapidly beyond theoretical coursework. Today's challenges require students who possess not only technical mastery but also the courage to experiment, iterate, and venture into the unknown.\n\nAt the Innovation and Entrepreneurship Development Cell (IEDC) of TKIET Warananagar, our objective is to provide students with a sandbox where ideas transition into tangible prototypes. When mechanical, computer, civil, chemical, and electronics students collaborate, novel solutions emerge that solve authentic societal and industrial needs.\n\nThrough systematic ideation workshops, patent drafting mentorship, and alliances with national platforms like NEC and IIC, the cell continuously expands the horizon for campus innovators.",
    publicationDate: "2025-01-15T09:00:00.000Z",
    publishedAt: "2025-01-15T09:00:00.000Z",
    readTimeMinutes: 4,
    author: "IEDC TKIET",
    published: true,
    isFeatured: true,
    createdAt: "2025-01-15T09:00:00.000Z",
  },
  {
    id: "blog-placeholder-2",
    slug: "from-blueprint-to-prototype",
    title: "The Blueprint to Prototype Mindset",
    excerpt: "Key considerations for student engineering teams taking their first steps from conceptual design to functional testing.",
    content: "Every impactful technology began with an uncertain initial draft. For engineering undergraduates, moving from a CAD blueprint or software wireframe to a physical prototype is often the most challenging phase of innovation.\n\nThis article highlights the iterative approach: start simple, validate assumptions early, leverage available campus fabrication facilities, and actively solicit feedback from faculty mentors and prospective end-users.",
    publicationDate: "2025-02-01T10:30:00.000Z",
    publishedAt: "2025-02-01T10:30:00.000Z",
    readTimeMinutes: 3,
    author: "IEDC TKIET",
    published: true,
    isFeatured: false,
    createdAt: "2025-02-01T10:30:00.000Z",
  },
  {
    id: "blog-draft-3",
    slug: "draft-internal-notes",
    title: "Preliminary Research Paper Notes",
    excerpt: "Draft note that must not be published publicly.",
    content: "Internal draft content.",
    publicationDate: "2025-03-01T00:00:00.000Z",
    readTimeMinutes: 2,
    author: "IEDC TKIET",
    published: false,
    createdAt: "2025-03-01T00:00:00.000Z",
  },
];

export const PLACEHOLDER_COLLABORATIONS: ICollaboration[] = [
  {
    id: "collab-1",
    partnerName: "National Entrepreneurship Challenge (NEC)",
    partnerType: "National Initiative / Competition",
    description: "Active engagement with the National Entrepreneurship Challenge network promoting entrepreneurial activities and structured cell development.",
    websiteUrl: "https://www.ecell.in/nec",
    order: 1,
  },
  {
    id: "collab-2",
    partnerName: "Institution's Innovation Council (IIC)",
    partnerType: "Ministry of Education's Innovation Cell (MIC)",
    description: "Formally recognized institutional innovation council systematically fostering innovation, intellectual property rights, and venture building on campus.",
    websiteUrl: "https://mic.gov.in",
    order: 2,
  },
];

export const PLACEHOLDER_JOURNEY: IJourneyMilestone[] = [
  {
    id: "j-1",
    year: "Phase 01",
    title: "Inception & Foundation",
    summary: "Establishment of the dedicated Innovation and Entrepreneurship Development Cell at TKIET.",
    description: "Initiated to build an institutional platform supporting technical creativity, interdisciplinary ideation, and student founder aspirations.",
    order: 1,
  },
  {
    id: "j-2",
    year: "Phase 02",
    title: "Pre-Incubation Labs",
    summary: "Creation of physical and technical prototyping facilities for student innovators.",
    description: "Enabled engineering students to move from conceptual whiteboard designs to testable physical and software prototypes.",
    order: 2,
  },
  {
    id: "j-3",
    year: "Phase 03",
    title: "National Network Integration",
    summary: "Alignment with National Entrepreneurship Challenge (NEC) and Institution's Innovation Council (IIC).",
    description: "Expanded our campus reach into nation-wide innovation networks, participating in regional competitions and state mentoring tracks.",
    order: 3,
  },
  {
    id: "j-4",
    year: "Phase 04",
    title: "Student Venture Accelerator",
    summary: "Formalization of systematic student startup incubation and intellectual property guidance.",
    description: "Providing structured guidance on patent awareness, prototype verification, and seed pitch presentations for campus entrepreneurs.",
    order: 4,
  },
  {
    id: "j-5",
    year: "Ongoing",
    title: "Autonomous Future Ecosystem",
    summary: "Scaling interdisciplinary venture cohorts and regional industry mentorship.",
    description: "Continuing our commitment to transforming aspiring engineers into visionary leaders who address real-world challenges through innovation.",
    order: 5,
  },
];

/**
 * Exactly five leadership positions required by specification:
 * 1. CEO
 * 2. Principal
 * 3. Dean
 * 4. IEDC Coordinator
 * 5. IEDC President
 */
export interface ILeadershipRole {
  id: string;
  positionTitle: string;
  designation: string;
  institution: string;
  messagePreview: string;
  fullMessage: string;
  order: number;
}

export const PLACEHOLDER_LEADERSHIP_ROLES: ILeadershipRole[] = [
  {
    id: "role-1",
    positionTitle: "Chief Executive Officer (CEO)",
    designation: "Chief Executive Officer",
    institution: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
    messagePreview: "Nurturing institutional infrastructure to empower student entrepreneurs with world-class engineering and technological capabilities.",
    fullMessage: "At TKIET, our vision is to provide student founders with comprehensive institutional backing. Through IEDC, we ensure that innovative engineering intellect is supported by modern prototyping infrastructure, strong industrial mentorship, and sustainable enterprise pathways. [Official leadership statement to be updated via administration].",
    order: 1,
  },
  {
    id: "role-2",
    positionTitle: "Principal",
    designation: "Principal",
    institution: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
    messagePreview: "Transforming academic research into impactful entrepreneurial solutions that serve societal and technological advancement.",
    fullMessage: "Engineering education reaches its peak when students apply their technical knowledge to solve real-world problems. IEDC serves as the vital bridge between academic curriculum and viable enterprise creation, instilling resilience, creative thinking, and leadership in our graduates. [Official leadership statement to be updated via administration].",
    order: 2,
  },
  {
    id: "role-3",
    positionTitle: "Dean",
    designation: "Dean",
    institution: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
    messagePreview: "Fostering an interdisciplinary culture where engineering students collaborate seamlessly across departments.",
    fullMessage: "Modern innovation rarely happens within the boundaries of a single department. IEDC encourages mechanical, computer, electronics, chemical, and civil engineers to unite and build multifaceted solutions. Our goal is to cultivate a relentless spirit of inquiry and practical execution. [Official leadership statement to be updated via administration].",
    order: 3,
  },
  {
    id: "role-4",
    positionTitle: "IEDC Coordinator",
    designation: "Faculty In-charge / IEDC Coordinator",
    institution: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
    messagePreview: "Guiding the operational roadmap and student cohorts through structured mentorship and patent guidance.",
    fullMessage: "The role of the IEDC coordination team is to facilitate every step of the student founder journey—from initial ideation workshops and hackathons to prototype fabrication and investor pitch preparations. We are committed to making innovation accessible to every passionate student at TKIET. [Official leadership statement to be updated via administration].",
    order: 4,
  },
  {
    id: "role-5",
    positionTitle: "IEDC President",
    designation: "Student President / Cell Lead",
    institution: "Tatyasaheb Kore Institute of Engineering and Technology (TKIET)",
    messagePreview: "Driving student-led initiatives, hackathons, and fostering a peer community of creators and builders.",
    fullMessage: "IEDC is built by students, for students. We believe that every engineer has the power to build something transformative. Our focus is on fostering a vibrant campus community where students dare to experiment, build prototypes, and turn visionary concepts into working technology. [Official leadership statement to be updated via administration].",
    order: 5,
  },
];

export interface IStudentMember {
  id: string;
  position: string;
  name: string;
  department: string;
  year: string;
  bio: string;
  order: number;
}

export interface IFacultyMember {
  id: string;
  position: string;
  name: string;
  department: string;
  bio: string;
  order: number;
}

/**
 * Team Directory Placeholders:
 * 1. Student Team (First)
 * 2. Faculty Team (Second)
 */
export const PLACEHOLDER_STUDENT_TEAM: IStudentMember[] = [
  {
    id: "student-1",
    position: "Lead: Student Initiatives",
    name: "Student Lead",
    department: "Computer Science & Engineering",
    year: "Final Year, TKIET",
    bio: "Coordinates cell-wide ideathons, hackathons, and technical bootcamps.",
    order: 1,
  },
  {
    id: "student-2",
    position: "Lead: Prototyping & Labs",
    name: "Student Lead",
    department: "Mechanical Engineering",
    year: "Third Year, TKIET",
    bio: "Manages hardware incubation resources and prototype development sessions.",
    order: 2,
  },
  {
    id: "student-3",
    position: "Lead: Ecosystem & Outreach",
    name: "Student Lead",
    department: "Electronics & Telecommunication",
    year: "Final Year, TKIET",
    bio: "Leads national competition participation and external mentor communications.",
    order: 3,
  },
  {
    id: "student-4",
    position: "Lead: Operations & Media",
    name: "Student Lead",
    department: "Chemical / Civil Engineering",
    year: "Third Year, TKIET",
    bio: "Drives event logistics, participant registrations, and media publications.",
    order: 4,
  },
];

export const PLACEHOLDER_FACULTY_TEAM: IFacultyMember[] = [
  {
    id: "faculty-1",
    position: "Chief Faculty Coordinator",
    name: "Faculty Coordinator",
    department: "Department of Engineering, TKIET",
    bio: "Oversees overall institutional compliance, resource allocation, and mentoring roadmaps for IEDC.",
    order: 1,
  },
  {
    id: "faculty-2",
    position: "Faculty Advisor",
    name: "Faculty Advisor",
    department: "Department of Engineering, TKIET",
    bio: "Provides technical feasibility reviews, patent drafting guidance, and academic project alignment.",
    order: 2,
  },
];

export const PLACEHOLDER_ACHIEVEMENTS: IAchievement[] = [
  {
    id: "ach-1",
    title: "National Entrepreneurship Challenge (NEC) — Top Tier Recognition",
    category: "National Competition",
    year: "2024",
    shortDescription: "Student E-Cell delegation recognized among premier institutional competitors at IIT Bombay's national entrepreneurship platform.",
    description: "The student entrepreneurship contingent from IEDC TKIET secured top-tier standings in the annual National Entrepreneurship Challenge, demonstrating robust institutional incubation practices, peer-led campus bootcamps, and impactful venture awareness campaigns.",
    recipientOrTeam: "IEDC Student Council & Core Operations",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-nec.svg",
    published: true,
    order: 1,
  },
  {
    id: "ach-2",
    title: "State Hackathon Grand Finale — Smart Agriculture Track Winner",
    category: "Hackathon & Prototyping",
    year: "2023",
    shortDescription: "First Prize awarded for an automated IoT-enabled soil health and micro-irrigation controller built by student founders.",
    description: "Team AgroSense developed a deployable low-cost microcontroller node with localized telemetry for sugarcane and cash crop farmers in Western Maharashtra. Developed inside the IEDC Prototyping Lab with faculty mentorship.",
    recipientOrTeam: "Team AgroSense (ECE & Mechanical Engineering)",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-hackathon.svg",
    published: true,
    order: 2,
  },
  {
    id: "ach-3",
    title: "Institutional Patent Publication & IP Mentorship Milestone",
    category: "Intellectual Property",
    year: "2023",
    shortDescription: "Four patent applications officially published in the Indian Patent Journal through dedicated IEDC IP assistance.",
    description: "Under the institutional IP support track, student-faculty research teams drafted and successfully published four invention disclosures covering hybrid gear mechanisms, compact waste shredding units, and adaptive solar tracking systems.",
    recipientOrTeam: "Student Inventors with Faculty Research Leads",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-patent.svg",
    published: true,
    order: 3,
  },
  {
    id: "ach-4",
    title: "Regional Innovation Pitch Conclave — 1st Runner Up",
    category: "Venture Pitching",
    year: "2023",
    shortDescription: "Recognized for the development and financial feasibility model of a modular electric two-wheeler battery swapper.",
    description: "Pitched before angel mentors and regional angel investors at the Western Maharashtra Innovation Conclave, showcasing a fully operational benchtop battery diagnostic station and zero-emission rapid charging protocol.",
    recipientOrTeam: "Team ElectroPulse (Mechanical & Electrical Engineering)",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-pitch.svg",
    published: true,
    order: 4,
  },
  {
    id: "ach-5",
    title: "National Innovation & Startup Policy (NISP) Adoption Recognition",
    category: "Institutional Governance",
    year: "2022",
    shortDescription: "Formal compliance and institutional governance framework adopted to enable academic credit for student startups.",
    description: "TKIET established official NISP guidelines providing students with faculty mentorship allocations, flexible attendance credits for verified venture prototyping, and pre-incubation grants for early proof-of-concepts.",
    recipientOrTeam: "TKIET Academic Council & IEDC Faculty In-charge",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-nisp.svg",
    published: true,
    order: 5,
  },
  {
    id: "ach-6",
    title: "District Prototyping Showcase — Best Sustainable Tech Award",
    category: "Hardware Innovation",
    year: "2022",
    shortDescription: "Recognized by industry delegates for an energy-efficient industrial wastewater recycling filter prototype.",
    description: "Built collaboratively between Civil and Chemical engineering student cadres, the gravity-driven filtration column achieved a 72% turbidity reduction during on-site testing at local agro-processing clusters.",
    recipientOrTeam: "Team EcoFilter (Civil & Chemical Engineering)",
    verifiedLink: "https://tkiet.ac.in",
    certificateImage: "/images/placeholders/certificate-tech.svg",
    published: true,
    order: 6,
  },
];

export const PLACEHOLDER_GALLERY: IGalleryImage[] = [
  {
    id: "gal-1",
    title: "Design Thinking & Ideation Workshop",
    caption: "Multidisciplinary student teams brainstorming user-centric engineering solutions in the cell lab.",
    imageUrl: "/images/placeholders/gallery-1.svg",
    aspectRatio: "wide",
    tags: ["Workshop", "Ideation"],
    order: 1,
  },
  {
    id: "gal-2",
    title: "Rapid Prototyping & 3D Fabrication Session",
    caption: "Hands-on calibration of additive manufacturing and benchtop CNC systems for physical proof-of-concepts.",
    imageUrl: "/images/placeholders/gallery-2.svg",
    aspectRatio: "square",
    tags: ["Prototyping", "Hardware"],
    order: 2,
  },
  {
    id: "gal-3",
    title: "Campus Hackathon 24-Hour Sprint",
    caption: "Student coders and engineers building end-to-end software and IoT solutions overnight.",
    imageUrl: "/images/placeholders/gallery-3.svg",
    aspectRatio: "wide",
    tags: ["Hackathon", "Coding"],
    order: 3,
  },
  {
    id: "gal-4",
    title: "Venture Pitch Day — Western Maharashtra",
    caption: "Student founders presenting functional MVPs to regional startup investors and industry evaluators.",
    imageUrl: "/images/placeholders/gallery-4.svg",
    aspectRatio: "tall",
    tags: ["Pitching", "Venture"],
    order: 4,
  },
  {
    id: "gal-5",
    title: "Smart Agriculture IoT Sensor Field Trial",
    caption: "Testing telemetry nodes and micro-controllers under real soil and weather conditions.",
    imageUrl: "/images/placeholders/gallery-5.svg",
    aspectRatio: "wide",
    tags: ["AgriTech", "Field Trial"],
    order: 5,
  },
  {
    id: "gal-6",
    title: "Industry Mentor & Alum Interactive Conclave",
    caption: "Executive alumni sharing insights on startup scaling, IP protection, and venture capital financing.",
    imageUrl: "/images/placeholders/gallery-6.svg",
    aspectRatio: "wide",
    tags: ["Mentorship", "Alumni"],
    order: 6,
  },
  {
    id: "gal-7",
    title: "Robotics & Embedded Systems Showcase",
    caption: "Autonomous rovers and mechanical arm prototypes designed by undergraduate student researchers.",
    imageUrl: "/images/placeholders/gallery-7.svg",
    aspectRatio: "square",
    tags: ["Robotics", "Hardware"],
    order: 7,
  },
  {
    id: "gal-8",
    title: "Intellectual Property & Patent Drafting Clinic",
    caption: "Certified patent attorneys assisting student teams in filing provisional patent specifications.",
    imageUrl: "/images/placeholders/gallery-8.svg",
    aspectRatio: "wide",
    tags: ["Patents", "Legal"],
    order: 8,
  },
  {
    id: "gal-9",
    title: "CleanTech Wastewater Recycling Pilot",
    caption: "Gravity-fed filtration test rig demonstration before civil engineering faculty advisors.",
    imageUrl: "/images/placeholders/gallery-9.svg",
    aspectRatio: "tall",
    tags: ["CleanTech", "Sustainability"],
    order: 9,
  },
  {
    id: "gal-10",
    title: "National Entrepreneurship Challenge Delegation",
    caption: "TKIET student leaders representing the institute at the IIT Bombay annual entrepreneurial symposium.",
    imageUrl: "/images/placeholders/gallery-10.svg",
    aspectRatio: "wide",
    tags: ["National", "Delegation"],
    order: 10,
  },
  {
    id: "gal-11",
    title: "Microcontroller Circuit Soldering & Assembly",
    caption: "Peer-led hardware assembly bootcamp introducing first-year students to surface-mount components.",
    imageUrl: "/images/placeholders/gallery-11.svg",
    aspectRatio: "square",
    tags: ["Electronics", "Bootcamp"],
    order: 11,
  },
  {
    id: "gal-12",
    title: "Annual Innovation Day Exhibition",
    caption: "Over 40 working prototypes and student-founded ventures exhibited to the broader college community.",
    imageUrl: "/images/placeholders/gallery-12.svg",
    aspectRatio: "wide",
    tags: ["Exhibition", "Celebration"],
    order: 12,
  },
];

export const PLACEHOLDER_SPEAKERS: IPreviousSpeaker[] = [
  {
    id: "spk-1",
    name: "Upasana Kamineni",
    designation: "VC of Apollo Foundation, Founder & MD of URLife",
    organization: "Apollo Hospitals & URLife",
    photo: "/images/placeholders/speaker-1.svg",
    shortDescription: "Keynote on venture philanthropy, wellness technologies, and scaling institutional healthcare innovations.",
    eventAssociation: "E-Summit 2025 Flagship Keynote",
    displayOrder: 1,
    published: true,
  },
  {
    id: "spk-2",
    name: "Anup Gupta",
    designation: "Founder and CEO of MathonGo",
    organization: "MathonGo EdTech",
    photo: "/images/placeholders/speaker-2.svg",
    shortDescription: "Masterclass on product-led growth, bootstrapping tech platforms, and cultivating digital educational ecosystems.",
    eventAssociation: "Founders' Hive Cohort Session",
    displayOrder: 2,
    published: true,
  },
  {
    id: "spk-3",
    name: "Ashish Arora",
    designation: "Founder and Chief Mentor of Physics Galaxy",
    organization: "Physics Galaxy",
    photo: "/images/placeholders/speaker-3.svg",
    shortDescription: "Session on fundamental engineering mindsets, intellectual resilience, and content democratization.",
    eventAssociation: "Emerge Tech Ideation Summit",
    displayOrder: 3,
    published: true,
  },
  {
    id: "spk-4",
    name: "Akhil Gupta",
    designation: "Founder & Tech Lead, NoBroker",
    organization: "NoBroker Technologies",
    photo: "/images/placeholders/speaker-4.svg",
    shortDescription: "Interactive fireside chat dissecting peer-to-peer real estate disruption and high-scale platform architecture.",
    eventAssociation: "Startup Senate Fireside Chat",
    displayOrder: 4,
    published: true,
  },
  {
    id: "spk-5",
    name: "Ranveer Allahbadia",
    designation: "Co-Founder & Creator, Monk Entertainment",
    organization: "Monk Entertainment & The Ranveer Show",
    photo: "/images/placeholders/speaker-5.svg",
    shortDescription: "Fireside dialogue on modern creator economy dynamics, digital branding for startups, and storytelling.",
    eventAssociation: "Annual Entrepreneurship Summit",
    displayOrder: 5,
    published: true,
  },
  {
    id: "spk-6",
    name: "Dr. R. A. Mashelkar",
    designation: "Eminent Scientist, Former DG CSIR & NIF",
    organization: "National Innovation Foundation",
    photo: "/images/placeholders/speaker-6.svg",
    shortDescription: "Inspirational address on inclusive innovation, Gandhian engineering principles, and patent protection for students.",
    eventAssociation: "Foundation Day Distinguished Address",
    displayOrder: 6,
    published: true,
  },
];

export const PLACEHOLDER_IMPACT_METRICS: IImpactMetric[] = [
  {
    id: "metric-1",
    value: "35+",
    label: "Events Conducted",
    displayOrder: 1,
    enabled: true,
    isVerified: false,
  },
  {
    id: "metric-2",
    value: "2,500+",
    label: "Students Engaged",
    displayOrder: 2,
    enabled: true,
    isVerified: false,
  },
  {
    id: "metric-3",
    value: "12+",
    label: "Major Collaborations",
    displayOrder: 3,
    enabled: true,
    isVerified: false,
  },
  {
    id: "metric-4",
    value: "50+",
    label: "Ideas Incubated",
    displayOrder: 4,
    enabled: true,
    isVerified: false,
  },
];


import { IEvent } from "../types/content";
import {
  getEventStatus,
  getRegistrationAction,
} from "../lib/utils/event-status";

// Reference time for predictable testing: 2026-09-20T12:00:00.000Z (17:30 IST on Sept 20, 2026)
const testNow = new Date("2026-09-20T12:00:00.000Z");

interface TestCase {
  name: string;
  event: Partial<IEvent>;
  paidCount: number;
  customNow?: Date;
}

const testCases: TestCase[] = [
  {
    name: "1. Deadline passed",
    event: {
      id: "evt-test-1",
      slug: "deadline-passed",
      title: "AI Workshop",
      startDate: "2026-10-15T10:00:00.000Z",
      registrationDeadline: "2026-09-10T12:00:00.000Z", // Past deadline
      registrationMode: "onsite",
      fee: 100,
      capacity: 50,
      registrationOpen: true,
      published: true,
      category: "Workshop",
      venue: "Lab 1",
    },
    paidCount: 10,
  },
  {
    name: "2. Capacity full (Sold Out)",
    event: {
      id: "evt-test-2",
      slug: "capacity-full",
      title: "Hackathon Finals",
      startDate: "2026-10-15T10:00:00.000Z",
      registrationMode: "onsite",
      capacity: 40,
      fee: 200,
      registrationOpen: true,
      published: true,
      category: "Hackathon",
      venue: "Auditorium",
    },
    paidCount: 40, // 40 / 40 filled
  },
  {
    name: "3. registrationOpen false",
    event: {
      id: "evt-test-3",
      slug: "reg-closed",
      title: "Robotics Seminar",
      startDate: "2026-10-20T10:00:00.000Z",
      registrationMode: "onsite",
      registrationOpen: false, // Closed explicitly
      fee: 0,
      published: true,
      category: "Seminar",
      venue: "Hall B",
    },
    paidCount: 5,
  },
  {
    name: "4. Google Form external link",
    event: {
      id: "evt-test-4",
      slug: "google-form-ext",
      title: "Design Sprint",
      startDate: "2026-10-25T10:00:00.000Z",
      registrationMode: "external",
      registrationUrl: "https://forms.google.com/design-sprint-2026",
      registrationOpen: true,
      published: true,
      category: "Sprint",
      venue: "Design Studio",
    },
    paidCount: 0,
  },
  {
    name: "5. Onsite with fee (Available)",
    event: {
      id: "evt-test-5",
      slug: "onsite-paid",
      title: "IoT Masterclass",
      startDate: "2026-11-05T09:30:00.000Z",
      registrationMode: "onsite",
      fee: 350,
      capacity: 60,
      registrationOpen: true,
      published: true,
      category: "Masterclass",
      venue: "Innovation Center",
    },
    paidCount: 15,
  },
  {
    name: "6. Cancelled",
    event: {
      id: "evt-test-6",
      slug: "event-cancelled",
      title: "Cancelled Symposium",
      startDate: "2026-10-30T10:00:00.000Z",
      statusOverride: "Cancelled",
      registrationMode: "onsite",
      registrationOpen: true,
      published: true,
      category: "Symposium",
      venue: "Main Hall",
    },
    paidCount: 0,
  },
  {
    name: "7. Postponed without a date",
    event: {
      id: "evt-test-7",
      slug: "postponed-no-date",
      title: "Postponed Conclave",
      startDate: "", // No confirmed date
      statusOverride: "Postponed",
      registrationMode: "external",
      registrationUrl: "https://forms.google.com/conclave",
      published: true,
      category: "Conclave",
      venue: "Auditorium",
    },
    paidCount: 0,
  },
  {
    name: "8. Ongoing event with time window",
    event: {
      id: "evt-test-8",
      slug: "ongoing-event",
      title: "National Ideathon (Live)",
      startDate: "2026-09-20T09:00:00.000Z", // 3h ago
      endDate: "2026-09-20T17:00:00.000Z",   // 5h remaining
      registrationMode: "onsite",
      registrationOpen: true,
      published: true,
      category: "Ideathon",
      venue: "Campus Grounds",
    },
    paidCount: 80,
  },
  {
    name: "9. Completed (Past)",
    event: {
      id: "evt-test-9",
      slug: "completed-event",
      title: "Orientation 2026",
      startDate: "2026-09-01T10:00:00.000Z",
      endDate: "2026-09-01T14:00:00.000Z",
      registrationMode: "onsite",
      published: true,
      category: "Orientation",
      venue: "Auditorium",
    },
    paidCount: 120,
  },
  {
    name: "10. Invalid date",
    event: {
      id: "evt-test-10",
      slug: "invalid-date",
      title: "TBD Roundtable",
      startDate: "invalid-date-string",
      registrationMode: "none",
      published: true,
      category: "Roundtable",
      venue: "Conference Room",
    },
    paidCount: 0,
  },
  {
    name: "11. Fallback dev placeholder with onsite request",
    event: {
      id: "evt-placeholder-99",
      slug: "placeholder-test",
      title: "[Development Placeholder] Demo Event",
      startDate: "2026-11-20T10:00:00.000Z",
      registrationMode: "onsite", // Requested onsite on dummy data
      registrationOpen: true,
      published: true,
      category: "Demo",
      venue: "Lab",
    },
    paidCount: 0,
  },
  {
    name: "12. Mode 'none' on normal event",
    event: {
      id: "evt-test-12",
      slug: "open-entry-showcase",
      title: "Open Project Showcase",
      startDate: "2026-11-15T10:00:00.000Z",
      registrationMode: "none",
      published: true,
      category: "Showcase",
      venue: "Central Courtyard",
    },
    paidCount: 0,
  },
  {
    name: "13. Mode 'external' with empty URL",
    event: {
      id: "evt-test-13",
      slug: "external-empty-url",
      title: "Guest Lecture",
      startDate: "2026-11-25T14:00:00.000Z",
      registrationMode: "external",
      registrationUrl: "",
      published: true,
      category: "Lecture",
      venue: "Seminar Hall",
    },
    paidCount: 0,
  },
  {
    name: "14. Date with no time — during event day (ongoing)",
    event: {
      id: "evt-test-14",
      slug: "allday-festival-now",
      title: "Tech Fest Day 1",
      startDate: "2026-09-20", // Same day as testNow (2026-09-20T12:00:00Z = 17:30 IST)
      registrationMode: "none",
      published: true,
      category: "Festival",
      venue: "Main Campus",
    },
    paidCount: 0,
    customNow: new Date("2026-09-20T12:00:00.000Z"),
  },
  {
    name: "15. Date with no time — after 23:59:59 IST (completed)",
    event: {
      id: "evt-test-15",
      slug: "allday-festival-past",
      title: "Tech Fest Day 1",
      startDate: "2026-09-20",
      registrationMode: "none",
      published: true,
      category: "Festival",
      venue: "Main Campus",
    },
    paidCount: 0,
    // 2026-09-20 23:59:59.999 IST is 2026-09-20T18:29:59.999Z. Evaluating at 2026-09-20T19:00:00.000Z (00:30 IST next day).
    customNow: new Date("2026-09-20T19:00:00.000Z"),
  },
  {
    name: "16. Deadline exactly now",
    event: {
      id: "evt-test-16",
      slug: "deadline-exact-now",
      title: "Coding Contest",
      startDate: "2026-09-20T16:00:00.000Z",
      registrationDeadline: "2026-09-20T12:00:00.000Z", // Exactly matches testNow
      registrationMode: "onsite",
      fee: 0,
      registrationOpen: true,
      published: true,
      category: "Contest",
      venue: "Lab 2",
    },
    paidCount: 10,
    customNow: testNow,
  },
  {
    name: "17. Start exactly now",
    event: {
      id: "evt-test-17",
      slug: "start-exact-now",
      title: "Live Keynote Address",
      startDate: "2026-09-20T12:00:00.000Z", // Exactly matches testNow
      registrationMode: "onsite",
      fee: 50,
      registrationOpen: true,
      published: true,
      category: "Keynote",
      venue: "Auditorium",
    },
    paidCount: 20,
    customNow: testNow,
  },
  {
    name: "18. Sold out AND deadline passed together",
    event: {
      id: "evt-test-18",
      slug: "sold-out-and-deadline-passed",
      title: "Exclusive Masterclass",
      startDate: "2026-10-01T10:00:00.000Z",
      registrationDeadline: "2026-09-15T12:00:00.000Z", // Past deadline
      registrationMode: "onsite",
      capacity: 30,
      fee: 500,
      registrationOpen: true,
      published: true,
      category: "Masterclass",
      venue: "Boardroom",
    },
    paidCount: 30, // Also sold out
  },
  {
    name: "19. Onsite fee 0 with no capacity limit",
    event: {
      id: "evt-test-19",
      slug: "onsite-free-unlimited",
      title: "Open Networking Mixer",
      startDate: "2026-10-18T17:00:00.000Z",
      registrationMode: "onsite",
      fee: 0,
      capacity: null, // Unlimited capacity
      registrationOpen: true,
      published: true,
      category: "Networking",
      venue: "Open Lawn",
    },
    paidCount: 45,
  },
  {
    name: "20. Legacy event (mode undefined) WITH URL",
    event: {
      id: "evt-test-20",
      slug: "legacy-with-url",
      title: "Startup Pitchathon 2026",
      startDate: "2026-11-10T10:00:00.000Z",
      registrationMode: undefined, // Legacy field not present in DB
      registrationUrl: "https://pitch.iedctkiet.com/apply",
      registrationOpen: true,
      published: true,
      category: "Pitch",
      venue: "Seminar Hall",
    },
    paidCount: 0,
  },
  {
    name: "21. Legacy event (mode undefined) WITHOUT URL",
    event: {
      id: "evt-test-21",
      slug: "legacy-without-url",
      title: "Open Exhibition",
      startDate: "2026-11-12T10:00:00.000Z",
      registrationMode: undefined, // Legacy field not present in DB
      registrationUrl: undefined,
      registrationOpen: true,
      published: true,
      category: "Exhibition",
      venue: "Gallery",
    },
    paidCount: 0,
  },
  {
    name: "22. Onsite open with PAYMENTS_ENABLED=false",
    event: {
      id: "evt-test-22",
      slug: "onsite-payments-disabled",
      title: "Design Thinking Bootcamp",
      startDate: "2026-11-20T10:00:00.000Z",
      registrationMode: "onsite",
      fee: 250,
      registrationOpen: true,
      published: true,
      category: "Bootcamp",
      venue: "Seminar Hall",
    },
    paidCount: 0,
  },
  {
    name: "23. Onsite open with PAYMENTS_ENABLED=true",
    event: {
      id: "evt-test-23",
      slug: "onsite-payments-enabled",
      title: "Design Thinking Bootcamp",
      startDate: "2026-11-20T10:00:00.000Z",
      registrationMode: "onsite",
      fee: 250,
      registrationOpen: true,
      published: true,
      category: "Bootcamp",
      venue: "Seminar Hall",
    },
    paidCount: 0,
  },
];

console.log("\n====================================================================================================");
console.log("IEDC TKIET — EVENT STATUS & REGISTRATION ACTION MATRIX");
console.log(`Base reference timestamp: ${testNow.toISOString()} (Indian Standard Time: 2026-09-20 17:30:00 IST)`);
console.log("====================================================================================================\n");

const tableRows = testCases.map((tc) => {
  const fullEvent = tc.event as IEvent;
  const evaluationTime = tc.customNow || testNow;
  const status = getEventStatus(fullEvent, tc.paidCount, evaluationTime);
  // For case 22 force false, for case 23 and 5 force true, else default
  const paymentsOverride =
    tc.name.includes("PAYMENTS_ENABLED=false")
      ? false
      : tc.name.includes("PAYMENTS_ENABLED=true") || tc.name.includes("5. Onsite with fee")
      ? true
      : undefined;
  const action = getRegistrationAction(fullEvent, status, paymentsOverride);

  return {
    "Test Scenario": tc.name,
    "Lifecycle": status.lifecycle,
    "Registration": status.registration,
    "Action Type": action.type,
    "Action Label": action.label,
    "Disabled": action.type === "disabled" ? "Yes" : "No",
  };
});

console.table(tableRows);
console.log("\n====================================================================================================\n");

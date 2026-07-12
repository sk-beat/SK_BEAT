export type ActivityCatalogItem = {
  id: string;
  title: string;
  category: string;
  budget: string;
  status: string;
};

export type ScheduledEvent = {
  id: string;
  title: string;
  category: string;
  time: string;
  location: string;
  attendees: string;
  status: string;
};

export const activityCatalog: ActivityCatalogItem[] = [
  {
    id: "act-1",
    title: "Basketball League",
    category: "Sports",
    budget: "P25,000",
    status: "Lalabas sa Survey",
  },
  {
    id: "act-2",
    title: "Leadership Training",
    category: "Training",
    budget: "P18,000",
    status: "Lalabas sa Survey",
  },
  {
    id: "act-3",
    title: "Community Clean-up Drive",
    category: "Community Service",
    budget: "P10,000",
    status: "Lalabas sa Survey",
  },
];

export const scheduledEvents: ScheduledEvent[] = [
  {
    id: "event-1",
    title: "Basketball League",
    category: "Sports",
    time: "09:00 AM",
    location: "Barangay Covered Court",
    attendees: "24 / 40 attendees",
    status: "ongoing",
  },
];

export const topSurveyPicks = [
  { rank: 1, title: "Basketball", votes: 12, budget: "P25,000" },
  { rank: 2, title: "Volleyball", votes: 8, budget: "P18,000" },
  { rank: 3, title: "Leadership seminar", votes: 6, budget: "P15,000" },
];

export const pastEvents = [
  {
    title: "Youth Assembly",
    meta: "June 18, 2026 - 32 response(s)",
  },
  {
    title: "Clean-up Drive",
    meta: "June 02, 2026 - 18 response(s)",
  },
];

export const calendarDays = Array.from({ length: 35 }, (_, index) => {
  const day = index - 2;
  return {
    label: day > 0 && day <= 31 ? String(day) : "",
    isSelected: day === 10,
    hasEvent: day === 10 || day === 22,
  };
});

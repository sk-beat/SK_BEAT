import type { EventData, StatData, SurveyData } from "./types";

export const statsData: StatData[] = [
  { label: "Surveys", count: 3, subtext: "2 pending" },
  { label: "Events", count: 5, subtext: "1 registered" },
];

export const surveysData: SurveyData[] = [
  {
    id: 1,
    title: "Youth Needs Assessment",
    meta: "5 questions - 5 min",
    status: "pending",
  },
  {
    id: 2,
    title: "Skills & Interests",
    meta: "Completed",
    status: "completed",
  },
  {
    id: 3,
    title: "Community Feedback",
    meta: "1 day left",
    status: "urgent",
  },
];

export const eventsData: EventData[] = [
  {
    id: 1,
    title: "Summer Sports Fest",
    date: "Jul 20 - 10:00 AM",
    status: "registered",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 2,
    title: "Leadership Workshop",
    date: "Aug 5 - 2:00 PM",
    status: "available",
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 3,
    title: "Community Outreach Day",
    date: "Aug 12 - 9:00 AM",
    status: "available",
    image:
      "https://images.unsplash.com/photo-1593113589914-0759972b0e2f?auto=format&fit=crop&q=80&w=400",
  },
];

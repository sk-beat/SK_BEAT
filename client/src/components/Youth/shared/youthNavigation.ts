import { Calendar, ClipboardList, Home, MessageSquare, User } from "lucide-react";

export const youthAppNavItems = [
  {
    to: "/youth",
    label: "Home",
    icon: Home,
    end: true,
  },
  {
    to: "/youth/surveys",
    label: "Surveys",
    icon: ClipboardList,
  },
  {
    to: "/youth/events",
    label: "Events",
    icon: Calendar,
  },
  {
    to: "/youth/feedback",
    label: "Feedback",
    icon: MessageSquare,
  },
  {
    to: "/youth/profile",
    label: "Profile",
    icon: User,
  },
];

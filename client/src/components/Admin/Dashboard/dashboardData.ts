import {
  AlertIcon,
  BanknoteIcon,
  CalendarIcon,
  ClipboardIcon,
  DollarIcon,
  LineChartIcon,
  UsersIcon,
  type IconProps,
} from "./icons";

export type SummaryCard = {
  title: string;
  value: string;
  note: string;
  noteTone?: "positive" | "muted";
  icon: (props: IconProps) => React.ReactNode;
  tone: "blue" | "green" | "yellow" | "purple";
};

export type Insight = {
  title: string;
  description: string;
  action: string;
  tone: "warning" | "success" | "info";
  icon: (props: IconProps) => React.ReactNode;
};

export const summaryCards: SummaryCard[] = [
  {
    title: "Total Youth",
    value: "0",
    note: "+12%",
    noteTone: "positive",
    icon: UsersIcon,
    tone: "blue",
  },
  {
    title: "Active Programs",
    value: "0",
    note: "+3",
    noteTone: "positive",
    icon: ClipboardIcon,
    tone: "green",
  },
  {
    title: "Total Budget",
    value: "P450,000",
    note: "75% used",
    icon: DollarIcon,
    tone: "yellow",
  },
  {
    title: "Upcoming Events",
    value: "0",
    note: "This month",
    icon: CalendarIcon,
    tone: "purple",
  },
];

export const insights: Insight[] = [
  {
    title: "Low Youth Participation in Health Programs",
    description:
      "Health & Wellness programs have 40% lower participation than Sports. Consider promoting health activities or adding incentives.",
    action: "Review Health Programs",
    tone: "warning",
    icon: AlertIcon,
  },
  {
    title: "Sports Programs Exceeding Targets",
    description:
      "Basketball and volleyball events consistently exceed attendance targets by 25%. Consider allocating more budget to expand successful sports activities.",
    action: "View Sports Analytics",
    tone: "success",
    icon: LineChartIcon,
  },
  {
    title: "Budget Optimization Opportunity",
    description:
      "Environmental programs have 35% unused budget. Reallocating P15,000 to Education could fund 2 additional scholarship slots.",
    action: "Adjust Budget",
    tone: "info",
    icon: BanknoteIcon,
  },
];

export const categories = [
  { label: "Sports", value: 84 },
  { label: "Education", value: 68 },
  { label: "Community", value: 53 },
  { label: "Health", value: 39 },
  { label: "Culture", value: 61 },
];

export const upcomingEvents = [
  {
    month: "JUL",
    day: "17",
    title: "Volleyball Tournament",
    time: "08:00",
    location: "Barangay Covered Court",
    registered: 0,
  },
  {
    month: "JUL",
    day: "18",
    title: "Volleyball Tournament",
    time: "08:00",
    location: "Barangay Covered Court",
    registered: 0,
  },
];

export const iconToneClasses = {
  blue: "bg-[#1e3a5f]/12 text-[#1e3a5f]",
  green: "bg-[#26ba9a]/16 text-teal-700",
  yellow: "bg-[#ff9f68]/20 text-orange-700",
  purple: "bg-[#312e81]/12 text-indigo-900",
};

export const insightToneClasses = {
  warning: {
    card: "bg-amber-100/40",
    icon: "bg-amber-100 text-amber-700",
  },
  success: {
    card: "bg-emerald-100/40",
    icon: "bg-emerald-100 text-emerald-700",
  },
  info: {
    card: "bg-blue-100/60",
    icon: "bg-blue-100 text-blue-700",
  },
};

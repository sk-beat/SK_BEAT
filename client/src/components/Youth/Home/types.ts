export interface StatData {
  label: string;
  count: number;
  subtext: string;
}

export interface SurveyData {
  id: number;
  title: string;
  meta: string;
  status: "pending" | "completed" | "urgent";
}

export interface EventData {
  id: number;
  title: string;
  date: string;
  status: "registered" | "available";
  image: string;
}

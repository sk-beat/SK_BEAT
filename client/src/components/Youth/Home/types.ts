export interface StatData {
  label: string;
  count: number;
  subtext: string;
}

export type YouthHomePastEvent = {
  event_id: number;
  event_name: string;
  category: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image: string | null;
  description: string | null;
};

import { supabase } from "@/lib/supabase";
import {
  getEventPreferenceRecommendations,
  getPreferredActivityTypes,
  type EventPreferenceRecommendation,
  type PreferredActivityType,
} from "../SurveysAnnouncements/SurveyInsightsService";

export type ActivityEventStatus =
  | "draft"
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export type ActivityCalculationType = "fixed" | "per_attendee";

export type ActivityExpense = {
  expense_id?: number;
  event_id?: number;
  expense_type: string;
  calculation_type: ActivityCalculationType;
  unit_cost: number;
  quantity: number;
  amount: number;
  description?: string | null;
};

export type ActivityBudgetItem = Omit<ActivityExpense, "expense_id" | "event_id">;

export type ActivityEvent = {
  event_id: number;
  budget_year_id: number | null;
  event_name: string;
  category: string;
  allocated_budget: number;
  budget_items: ActivityBudgetItem[];
  status: ActivityEventStatus;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number | null;
  cover_image: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  event_expenses: ActivityExpense[];
  event_registrations?: { registration_id: number; attendance_status?: string | null }[];
};

export type SaveActivityEventPayload = {
  event_id: number | null;
  budget_year_id: number | null;
  event_name: string;
  category: string;
  status: ActivityEventStatus;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number;
  cover_image: string | null;
  description: string | null;
  expenses: ActivityExpense[];
};

type AnnualBudgetRow = {
  budget_year_id: number;
};

export async function getActivityEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(
      "event_id,budget_year_id,event_name,category,allocated_budget,budget_items,status,event_date,event_time,location,expected_attendees,cover_image,description,created_by,created_at,event_expenses(expense_id,event_id,expense_type,calculation_type,unit_cost,quantity,amount,description),event_registrations(registration_id)",
    )
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as ActivityEvent[], error };
}

export async function getActivityDecisionData() {
  const [preferred, suggested, performance] = await Promise.all([
    getPreferredActivityTypes(),
    getEventPreferenceRecommendations(),
    supabase.rpc("get_admin_completed_event_performance"),
  ]);

  return {
    data: {
      completedEventPerformance: (performance.data ?? []) as CompletedEventPerformance[],
      preferredActivityTypes: preferred.data as PreferredActivityType[],
      topSuggestedEvents: suggested.data as EventPreferenceRecommendation[],
    },
    error: preferred.error || suggested.error || performance.error,
  };
}

export type ActivityRecommendation = EventPreferenceRecommendation;

export type CompletedEventPerformance = {
  event_id: number;
  event_name: string;
  category: string;
  event_date: string | null;
  expected_attendees: number | null;
  allocated_budget: number;
  registration_count: number;
  attendance_count: number;
  attendance_rate: number | null;
  registration_fill_rate: number | null;
  feedback_count: number;
  average_feedback_rating: number | null;
  completed_spending: number;
  budget_utilization_percentage: number | null;
};

export type AdminEventRegistration = {
  registration_id: number;
  event_id: number;
  profile_id: string;
  fullname: string;
  email: string;
  purok: string | null;
  profile_image: string | null;
  registration_date: string | null;
  attendance_status: "registered" | "attended" | "absent" | null;
  total_registrations: number;
  registered_count: number;
  attended_count: number;
  absent_count: number;
  occupied_slots: number;
  expected_attendees: number | null;
  remaining_slots: number | null;
};

export async function getCurrentBudgetYearId() {
  const { data, error } = await supabase
    .from("annual_budgets")
    .select("budget_year_id")
    .eq("fiscal_year", new Date().getFullYear())
    .maybeSingle();

  return { data: data as AnnualBudgetRow | null, error };
}

export async function saveActivityEvent(payload: SaveActivityEventPayload) {
  const { data, error } = await supabase.rpc("save_admin_event_with_expenses", {
    p_budget_year_id: payload.budget_year_id,
    p_category: payload.category,
    p_description: payload.description,
    p_event_date: payload.event_date,
    p_event_id: payload.event_id,
    p_event_name: payload.event_name,
    p_event_time: payload.event_time,
    p_expected_attendees: payload.expected_attendees,
    p_expenses: payload.expenses.map((expense) => ({
      calculation_type: expense.calculation_type,
      description: expense.description ?? null,
      expense_type: expense.expense_type,
      quantity: expense.quantity,
      unit_cost: expense.unit_cost,
    })),
    p_cover_image: payload.cover_image,
    p_location: payload.location,
    p_status: payload.status,
  });

  return { data: data as ActivityEvent | null, error };
}

export async function deleteActivityEvent(eventId: number) {
  return await supabase.rpc("delete_admin_event", {
    p_event_id: eventId,
  });
}

export async function getAdminEventRegistrations(options: {
  attendanceStatus?: "registered" | "attended" | "absent" | null;
  eventId: number;
  search?: string;
}) {
  const { data, error } = await supabase.rpc("get_admin_event_registrations", {
    p_attendance_status: options.attendanceStatus ?? null,
    p_event_id: options.eventId,
    p_search: options.search?.trim() || null,
  });

  return { data: (data ?? []) as AdminEventRegistration[], error };
}

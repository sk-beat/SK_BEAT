import { supabase } from "@/lib/supabase";

export type FinancialTransactionType =
  | "expense"
  | "disbursement"
  | "reimbursement";

export type FinancialTransactionStatus =
  | "pending"
  | "approved"
  | "completed"
  | "cancelled"
  | "rejected";

export type AnnualBudget = {
  budget_year_id: number;
  fiscal_year: number;
  total_allocation: number;
  remaining_balance: number;
  created_at: string | null;
};

export type FinancialSummary = {
  budget_year_id: number;
  fiscal_year: number;
  total_annual_budget: number;
  total_allocated_budget: number;
  total_completed_spending: number;
  total_approved_amount: number;
  total_pending_amount: number;
  pending_count: number;
  transaction_count: number;
  unallocated_budget: number;
  available_to_spend: number;
};

export type FinancialEventBudget = {
  event_id: number;
  budget_year_id: number | null;
  event_name: string;
  category: string;
  status: string;
  event_date: string | null;
  allocated_budget: number;
  completed_spending: number;
  approved_amount: number;
  pending_amount: number;
  remaining_event_budget: number;
};

export type FinancialTransaction = {
  transaction_id: number;
  budget_year_id: number;
  event_id: number | null;
  transaction_type: FinancialTransactionType;
  category: string;
  amount: number;
  transaction_date: string;
  status: FinancialTransactionStatus;
  description: string | null;
  reference_number: string | null;
  payment_method: string | null;
  receipt_path: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  events?: {
    event_name: string;
    allocated_budget: number;
  } | null;
  admins?: {
    fullname: string;
    email: string;
  } | null;
};

export type FinancialTransactionPayload = {
  transaction_id?: number | null;
  budget_year_id: number;
  event_id: number | null;
  transaction_type: FinancialTransactionType;
  category: string;
  amount: number;
  transaction_date: string;
  status: FinancialTransactionStatus;
  description: string | null;
  reference_number: string | null;
  payment_method: string | null;
  receipt_path: string | null;
};

export type FinancialTransactionFilters = {
  budgetYearId: number;
  eventId?: number | "all";
  page: number;
  pageSize: number;
  search: string;
  sortBy: "transaction_date" | "amount" | "category" | "status" | "created_at";
  sortDirection: "asc" | "desc";
  status: FinancialTransactionStatus | "all";
  type: FinancialTransactionType | "all";
};

export type FinancialTransactionPage = {
  count: number;
  records: FinancialTransaction[];
};

const transactionSelect =
  "transaction_id,budget_year_id,event_id,transaction_type,category,amount,transaction_date,status,description,reference_number,payment_method,receipt_path,created_by,created_at,updated_at,events(event_name,allocated_budget),admins(fullname,email)";

function toNumberRecord<T extends Record<string, unknown>>(
  row: T,
  fields: Array<keyof T>,
) {
  const next = { ...row };

  fields.forEach((field) => {
    next[field] = Number(next[field] ?? 0) as T[keyof T];
  });

  return next;
}

export async function getAnnualBudgets() {
  const { data, error } = await supabase
    .from("annual_budgets")
    .select("*")
    .order("fiscal_year", { ascending: false });

  return {
    data: (data ?? []).map((row) =>
      toNumberRecord(row, ["total_allocation", "remaining_balance"]),
    ) as AnnualBudget[],
    error,
  };
}

export async function createAnnualBudget(amount: number) {
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from("annual_budgets")
    .insert({
      fiscal_year: currentYear,
      remaining_balance: amount,
      total_allocation: amount,
    })
    .select()
    .single();

  return {
    data: data
      ? (toNumberRecord(data, [
          "total_allocation",
          "remaining_balance",
        ]) as AnnualBudget)
      : null,
    error,
  };
}

export async function getFinancialSummary(budgetYearId: number) {
  const { data, error } = await supabase
    .from("financial_summary_by_budget_year")
    .select("*")
    .eq("budget_year_id", budgetYearId)
    .maybeSingle();

  return {
    data: data
      ? (toNumberRecord(data, [
          "total_annual_budget",
          "total_allocated_budget",
          "total_completed_spending",
          "total_approved_amount",
          "total_pending_amount",
          "unallocated_budget",
          "available_to_spend",
        ]) as FinancialSummary)
      : null,
    error,
  };
}

export async function getFinancialEventBudgets(budgetYearId: number) {
  const { data, error } = await supabase
    .from("financial_event_budget_status")
    .select("*")
    .eq("budget_year_id", budgetYearId)
    .order("event_date", { ascending: true, nullsFirst: false });

  return {
    data: (data ?? []).map((row) =>
      toNumberRecord(row, [
        "allocated_budget",
        "completed_spending",
        "approved_amount",
        "pending_amount",
        "remaining_event_budget",
      ]),
    ) as FinancialEventBudget[],
    error,
  };
}

export async function getFinancialTransactions(
  filters: FinancialTransactionFilters,
): Promise<{ data: FinancialTransactionPage | null; error: unknown }> {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  let query = supabase
    .from("financial_transactions")
    .select(transactionSelect, { count: "exact" })
    .eq("budget_year_id", filters.budgetYearId);

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.type !== "all") {
    query = query.eq("transaction_type", filters.type);
  }

  if (filters.eventId !== undefined && filters.eventId !== "all") {
    query = query.eq("event_id", filters.eventId);
  }

  const search = filters.search.trim();

  if (search) {
    query = query.or(
      [
        `category.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `reference_number.ilike.%${search}%`,
        `payment_method.ilike.%${search}%`,
      ].join(","),
    );
  }

  const { data, error, count } = await query
    .order(filters.sortBy, { ascending: filters.sortDirection === "asc" })
    .range(from, to);

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      count: count ?? 0,
      records: (data ?? []).map((row) =>
        toNumberRecord(row as unknown as FinancialTransaction, ["amount"]),
      ),
    },
    error: null,
  };
}

export async function getFinancialTransactionsForCharts(budgetYearId: number) {
  const { data, error } = await supabase
    .from("financial_transactions")
    .select("transaction_id,budget_year_id,event_id,transaction_type,category,amount,transaction_date,status,description,reference_number,payment_method,receipt_path,created_by,created_at,updated_at,events(event_name,allocated_budget),admins(fullname,email)")
    .eq("budget_year_id", budgetYearId)
    .order("transaction_date", { ascending: true });

  return {
    data: (data ?? []).map((row) =>
      toNumberRecord(row as unknown as FinancialTransaction, ["amount"]),
    ),
    error,
  };
}

export async function saveFinancialTransaction(
  payload: FinancialTransactionPayload,
) {
  const { data, error } = await supabase.rpc(
    "save_admin_financial_transaction",
    {
      p_amount: payload.amount,
      p_budget_year_id: payload.budget_year_id,
      p_category: payload.category,
      p_description: payload.description,
      p_event_id: payload.event_id,
      p_payment_method: payload.payment_method,
      p_receipt_path: payload.receipt_path,
      p_reference_number: payload.reference_number,
      p_status: payload.status,
      p_transaction_date: payload.transaction_date,
      p_transaction_id: payload.transaction_id ?? null,
      p_transaction_type: payload.transaction_type,
    },
  );

  return {
    data: data
      ? (toNumberRecord(data as FinancialTransaction, [
          "amount",
        ]) as FinancialTransaction)
      : null,
    error,
  };
}

export async function deleteFinancialTransaction(transactionId: number) {
  return await supabase
    .from("financial_transactions")
    .delete()
    .eq("transaction_id", transactionId);
}

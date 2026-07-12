export type FinancialSummaryItem = {
  note?: string;
  title: string;
  tone: "blue" | "yellow" | "red" | "green";
  value: string;
};

export const financialSummary: FinancialSummaryItem[] = [
  { title: "Total Annual Budget", value: "P450,000", tone: "blue" },
  { title: "Allocated", value: "P450,000", tone: "yellow" },
  { title: "Used", value: "P338,000", tone: "red" },
  {
    title: "Remaining",
    value: "P112,000",
    tone: "green",
    note: "Before expenses your budget is P450,000",
  },
];

export const budgetAllocation = [
  { name: "Sports Programs", amount: "P120,000", percent: "26.7%", color: "#1a529b" },
  { name: "Educational Activities", amount: "P100,000", percent: "22.2%", color: "#0d9488" },
  { name: "Community Service", amount: "P80,000", percent: "17.8%", color: "#ff9f68" },
  { name: "Health & Wellness", amount: "P70,000", percent: "15.6%", color: "#312e81" },
  { name: "Cultural Events", amount: "P80,000", percent: "17.8%", color: "#26ba9a" },
];

export type EventBudget = {
  allocated: string;
  percent: number;
  spent: string;
  title: string;
};

export const eventBudgets: EventBudget[] = [
  { title: "Basketball League", allocated: "P120,000", spent: "P85,000", percent: 71 },
  { title: "Leadership Training", allocated: "P100,000", spent: "P76,000", percent: 76 },
  { title: "Clean-up Drive", allocated: "P80,000", spent: "P52,000", percent: 65 },
];

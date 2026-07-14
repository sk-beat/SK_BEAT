export const surveyCards = [
  {
    id: 1,
    title: "Youth Community Development Survey",
    status: "Open",
    deadline: "Ends July 30, 2026",
    questions: "8 questions",
  },
  {
    id: 2,
    title: "Skills and Interests Survey",
    status: "Open",
    deadline: "Ends August 5, 2026",
    questions: "5 questions",
  },
  {
    id: 3,
    title: "Community Feedback Survey",
    status: "Open",
    deadline: "Ends August 12, 2026",
    questions: "6 questions",
  },
];

export type SurveyCard = (typeof surveyCards)[number];

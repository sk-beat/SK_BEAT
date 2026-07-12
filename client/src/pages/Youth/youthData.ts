import basketballImage from "../../assets/basketball.jpg";
import galasImage from "../../assets/galas.jpg";
import scholarImage from "../../assets/scholar.jpg";
import seminarImage from "../../assets/seminar.jpg";

export const youthImages = {
  basketball: basketballImage,
  galas: galasImage,
  scholar: scholarImage,
  seminar: seminarImage,
};

export const youthNavItems = [
  { label: "Home", to: "/youth-portal" },
  { label: "SK Officials", to: "/youth-officials" },
  { label: "Events", to: "/youth-events" },
  { label: "Surveys", to: "/youth-surveys" },
];

export const youthEvents = [
  {
    title: "Basketball League",
    date: "July 22, 2026",
    image: basketballImage,
    description: "A barangay-wide sports program for youth teams.",
  },
  {
    title: "Scholarship Orientation",
    date: "August 3, 2026",
    image: scholarImage,
    description: "Guidance for students preparing scholarship requirements.",
  },
  {
    title: "Leadership Seminar",
    date: "August 15, 2026",
    image: seminarImage,
    description: "Skills training for youth leaders and volunteers.",
  },
];

export type YouthEvent = (typeof youthEvents)[number];

export const youthAnnouncements = [
  {
    title: "Barangay Youth Assembly",
    date: "Posted July 12, 2026",
    message:
      "All registered youth are invited to attend the upcoming assembly for program updates and consultation.",
    image: galasImage,
  },
  {
    title: "Scholarship Requirements",
    date: "Posted July 10, 2026",
    message:
      "Prepare your certificate of enrollment, barangay certificate, and latest grades for the scholarship orientation.",
    image: scholarImage,
  },
];

export type YouthAnnouncement = (typeof youthAnnouncements)[number];

export const officials = [
  "SK Chairperson",
  "SK Kagawad - Education",
  "SK Kagawad - Health",
  "SK Kagawad - Sports",
  "SK Kagawad - Environment",
  "SK Secretary",
  "SK Treasurer",
  "Youth Volunteer Lead",
];

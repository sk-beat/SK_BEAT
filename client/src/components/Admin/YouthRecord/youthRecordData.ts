export type YouthRecord = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  address: string;
  contact: string;
  email: string;
  scholar: "Scholar" | "Non-Scholar";
  status: "Active" | "Inactive";
  purok: string;
};

export const youthRecords: YouthRecord[] = [
  {
    id: "0001",
    name: "Maria Santos",
    age: 19,
    gender: "Female",
    address: "Barangay Galas Maasim",
    contact: "0917-123-4567",
    email: "maria.santos@email.com",
    scholar: "Scholar",
    status: "Active",
    purok: "Purok 1",
  },
  {
    id: "0002",
    name: "Juan Reyes",
    age: 21,
    gender: "Male",
    address: "Barangay Galas Maasim",
    contact: "0928-555-0198",
    email: "juan.reyes@email.com",
    scholar: "Non-Scholar",
    status: "Active",
    purok: "Purok 3",
  },
  {
    id: "0003",
    name: "Angela Cruz",
    age: 17,
    gender: "Female",
    address: "Barangay Galas Maasim",
    contact: "0906-441-7822",
    email: "angela.cruz@email.com",
    scholar: "Scholar",
    status: "Inactive",
    purok: "Purok 2",
  },
];

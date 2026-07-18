export type YouthRecord = {
  profile_id: string;
  fullname: string;
  email: string;
  contact_number: string;
  age: number | null;
  date_of_birth: string | null;
  gender: "Male" | "Female" ;
  purok: string ;
  address_line: string ;
  scholar_status: "Scholar" | "Non-Scholar" ;
  educational_status: "Active" | "Inactive";
  profile_image: string | "";
  password: string | "";
  created_at: string | null;
};


export type CreateYouthRecord = Omit<YouthRecord, "profile_id" | "created_at" | "age">;

export type UpdateYouthRecord = Omit<YouthRecord,"profile_id" | "created_at" | "email" | "password" | "age">;


export const youthRecords: YouthRecord[] = [];

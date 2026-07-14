export type YouthRecord = {
  profile_id: string;
  fullname: string;
  email: string;
  contact_number: string;
  age: number ;
  gender: "Male" | "Female" ;
  purok: string ;
  address_line: string ;
  scholar_status: "Scholar" | "Non-Scholar" ;
  educational_status: "Active" | "Inactive" | "Student" | "Out of School Youth";
  profile_image: string | "";
  password: string | "";
  created_at: string | null;
};


export type CreateYouthRecord = Omit<YouthRecord, "profile_id" | "created_at">;

export type UpdateYouthRecord = Omit<YouthRecord,"profile_id" | "created_at" | "email" | "password">;


export const youthRecords: YouthRecord[] = [];

export type YouthRecord = {
  profile_id: string;
  fullname: string;
  email: string;
  contact_number: string;
  status: "active" | "inactive";
  account_lock_reason: "age_limit" | "manual_admin" | null;
  account_locked_at: string | null;
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


export type CreateYouthRecord = Omit<
  YouthRecord,
  | "profile_id"
  | "created_at"
  | "age"
  | "status"
  | "account_lock_reason"
  | "account_locked_at"
>;

export type UpdateYouthRecord = Omit<
  YouthRecord,
  | "profile_id"
  | "created_at"
  | "email"
  | "password"
  | "age"
  | "status"
  | "account_lock_reason"
  | "account_locked_at"
>;


export const youthRecords: YouthRecord[] = [];

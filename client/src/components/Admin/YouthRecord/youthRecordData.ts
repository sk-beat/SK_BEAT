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
  must_change_password?: boolean;
  onboarding_status?: "temporary_password_active" | "completed" | null;
  welcome_email_sent_at?: string | null;
  welcome_email_last_attempt_at?: string | null;
  welcome_email_last_error?: string | null;
  welcome_email_attempt_count?: number;
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
  | "must_change_password"
  | "onboarding_status"
  | "welcome_email_sent_at"
  | "welcome_email_last_attempt_at"
  | "welcome_email_last_error"
  | "welcome_email_attempt_count"
>;

export type UpdateYouthRecord = Omit<
  YouthRecord,
  | "profile_id"
  | "created_at"
  | "email"
  | "age"
  | "status"
  | "account_lock_reason"
  | "account_locked_at"
  | "must_change_password"
  | "onboarding_status"
  | "welcome_email_sent_at"
  | "welcome_email_last_attempt_at"
  | "welcome_email_last_error"
  | "welcome_email_attempt_count"
>;


export const youthRecords: YouthRecord[] = [];

export type AppRole = "admin" | "technician" | "faculty";

export type LoginPayload = {
  username: string;
  password: string;
  remember: boolean;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  role: AppRole | null;
  username: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

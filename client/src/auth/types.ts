export type AppRole = "admin" | "kabataan";

export type AuthUser = {
  id: string;
  email: string;
  fullname?: string;
  mustChangePassword?: boolean;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: AppRole | null;
  loading: boolean;
  login(payload: LoginPayload): Promise<{ role: AppRole; user: AuthUser }>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
};

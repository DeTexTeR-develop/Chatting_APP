export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

export type AuthAction =
  | { type: "SET_LOADING" }
  | { type: "SET_USER"; payload: AuthUser }
  | { type: "CLEAR_USER" };

export interface AuthContextValue extends AuthState {
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { status: "loading", user: null };
    case "SET_USER":
      return { status: "authenticated", user: action.payload };
    case "CLEAR_USER":
      return { status: "unauthenticated", user: null };
    default:
      return state;
  }
}

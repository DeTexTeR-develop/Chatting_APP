import React, { createContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../api/apiClient";
import { userService } from "../services/userService";
import { authReducer } from "./AuthContext.types";
import type { AuthContextValue, AuthState, AuthUser } from "./AuthContext.types";

// Initial state: loading while session is being verified on mount
const initialState: AuthState = {
  status: "loading",
  user: null,
};

// Create the context with a default value of null (consumers must be inside AuthProvider)
export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider wraps the application and manages session state.
 *
 * On mount:
 *   1. Registers its dispatch with apiClient so any 401 from any request
 *      automatically clears the session globally.
 *   2. Calls userService.getMe() to verify whether a valid session cookie exists.
 *      - 200 OK: dispatches SET_USER with the first user in the returned list.
 *      - 401 or any error: dispatches CLEAR_USER.
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Wire up the global 401 handler so any API call that returns 401
    // will dispatch CLEAR_USER through this context's reducer.
    apiClient.setAuthContextRef(dispatch);

    // Verify session on mount by calling GET /user
    let cancelled = false;

    (async () => {
      try {
        const result = await userService.getMe();

        if (cancelled) return;

        if (result.success && result.data && result.data.users.length > 0) {
          // Use the first user as the current authenticated user
          const currentUser = result.data.users[0];
          dispatch({
            type: "SET_USER",
            payload: {
              id: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              role: currentUser.role,
            },
          });
        } else {
          // 401 is handled globally by apiClient, but also handle any non-success here
          dispatch({ type: "CLEAR_USER" });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: "CLEAR_USER" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = (user: AuthUser): void => {
    dispatch({ type: "SET_USER", payload: user });
  };

  const clearUser = (): void => {
    dispatch({ type: "CLEAR_USER" });
  };

  const value: AuthContextValue = {
    ...state,
    setUser,
    clearUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

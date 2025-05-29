"use client";

import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useCookies } from "react-cookie";

// API base URL
const API_BASE_URL =
  process.env.NEXT_PROD_API_URL || "https://blogapp-62q1.onrender.com";
const TOKEN_COOKIE_NAME = "midnight-musings-token";

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    pass: string,
    role?: string
  ) => Promise<boolean>;
  loading: boolean;
  token: string | null;
  setUser: (user: User | null) => void; // Add this explicit type
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies([TOKEN_COOKIE_NAME]);
  const router = useRouter();

  // Create a proper setUser function that updates the state
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      // Try to get token from cookies first (works in both client and SSR)
      let authToken = cookies[TOKEN_COOKIE_NAME];

      // If not in cookies, try localStorage as fallback (client-side only)
      if (!authToken && typeof window !== "undefined") {
        authToken = localStorage.getItem(TOKEN_COOKIE_NAME);

        // If found in localStorage but not in cookies, sync them
        if (authToken) {
          setCookie(TOKEN_COOKIE_NAME, authToken, {
            path: "/",
            sameSite: "strict",
          });
        }
      }

      if (authToken) {
        setToken(authToken);
        await fetchCurrentUser(authToken);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("Initializing auth state");
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      console.log("Stored token exists:", !!storedToken);
      console.log("Stored user exists:", !!storedUser);

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("Parsed user data:", userData);
          console.log("User ID from storage:", userData.id);

          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
    };

    initializeAuth();
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-currentuser-details`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserState({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          bio: data.user.bio || "",
        });
      } else {
        // Token might be expired or invalid
        clearAuthState();
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  // Helper to clear auth state from both cookies and localStorage
  const clearAuthState = () => {
    removeCookie(TOKEN_COOKIE_NAME, { path: "/" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_COOKIE_NAME);
    }
    setToken(null);
    setUserState(null);
  };

  // const login = async (email: string, password: string): Promise<boolean> => {
  //   setLoading(true);
  //   try {
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  //     const response = await fetch(`${API_BASE_URL}/login`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ email, password }),
  //       signal: controller.signal,
  //     });

  //     clearTimeout(timeoutId);

  //     const data = await response.json();

  //     if (response.ok) {
  //       console.error(`Login failed with status: ${response.status}`);
  //       const userData = {
  //         id: data.user._id,
  //         name: data.user.name,
  //         email: data.user.email,
  //         role: data.user.role || "user",
  //         bio: data.user.bio || '',
  //       };

  //       setUserState(userData);
  //       setToken(data.token);

  //       // Store token in both localStorage and cookies
  //       if (typeof window !== 'undefined') {
  //         localStorage.setItem(TOKEN_COOKIE_NAME, data.token);
  //       }
  //       setCookie(TOKEN_COOKIE_NAME, data.token, { path: '/', sameSite: 'strict' });

  //       return true;
  //     } else {
  //       console.error("Login failed:", data.message);
  //       return false;
  //     }
  //   } catch (error: any) {
  //     if (error.name === "AbortError") {
  //       console.error("Login request timed out");
  //     } else {
  //       console.error("Login error:", error);
  //     }
  //     return false;
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Inside your AuthProvider component

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        console.error(`Login failed with status: ${response.status}`);

        // Try to get error message if possible
        try {
          const errorData = await response.json();
          console.error("Error details:", errorData);
        } catch (e) {
          // If can't parse as JSON, log the text
          const textResponse = await response.text();
          console.error(
            "Response was not JSON:",
            textResponse.substring(0, 200) + "..."
          );
        }

        return false;
      }

      const data = await response.json();

      // Make sure we're correctly storing the user ID
      if (data.token && data.user) {
        // Ensure we have the correct ID property
        const userData = {
          id: data.user._id || data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          bio: data.user.bio || "",
          role: data.user.role || "User",
        };

        setUser(userData);
        setToken(data.token);

        // Store in localStorage as well
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));

        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-throw for component-level handling
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUserState(null);
    setToken(null);

    // Clear from both localStorage and cookies
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_COOKIE_NAME);
    }
    removeCookie(TOKEN_COOKIE_NAME, { path: "/" });

    router.push("/login");
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = "User"
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || "User",
          bio: data.user.bio || "",
        };

        setUserState(userData);
        setToken(data.token);

        // Store token in both localStorage and cookies
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_COOKIE_NAME, data.token);
        }
        setCookie(TOKEN_COOKIE_NAME, data.token, {
          path: "/",
          sameSite: "strict",
        });

        return true;
      } else {
        console.error("Registration failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        setUser, // Expose the setUser function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

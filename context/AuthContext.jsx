// src/AuthContext.js
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import pb from "../services/pocketbase"; // Adjust path
import { useRouter } from "next/navigation";

const AuthContext = createContext(undefined);

/** Provides authentication state and actions */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const router = useRouter();

  // Initialize PocketBase and set up user state
  useEffect(() => {
    if (pb) {
      setUser(pb.authStore.model);
      const unsubscribe = pb.authStore.onChange((token, model) => {
        setUser(model);
      });
      return () => unsubscribe();
    } else {
      console.warn("AuthProvider: pb instance is null.");
      setUser(null);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    if (!pb) return alert("Login service unavailable.");
    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);
      redirectUser(authData.record?.role);
      return authData.record;
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Check credentials.");
    }
  };

  // logout function
  const logout = () => {
    if (!pb) return;
    pb.authStore.clear();
    router.push("/authentication");
  };

  // Redirect based on user role
  const redirectUser = (role) => {
    const targetRole = role?.toLowerCase();
    switch (targetRole) {
      case "admin":
        router.push("/admin");
        break;
      case "technician":
        router.push("/technician");
        break;
      case "customer":
        router.push("/customer");
        break;
      default:
        router.push("/authentication");
    }
  };

  // Contexts stored in browser
  const contextValue = {
    user,
    login,
    logout,
    redirectUser,
    isUserLoading: user === undefined,
    isPbInitialized: !!pb,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/** Hook to access authentication context */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

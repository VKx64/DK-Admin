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
      // Set initial user from authStore
      setUser(pb.authStore.model);

      // Set up auth store listener
      const unsubscribe = pb.authStore.onChange(async (token, model) => {
        if (model) {
          try {
            // Fetch the user with expanded branch_details and technician_details
            const expandedUser = await pb.collection("users").getOne(model.id, {
              expand: 'branch_details,technician_details'
            });
            setUser(expandedUser);
          } catch (error) {
            console.error("Error fetching expanded user data:", error);
            setUser(model); // Fallback to the basic model
          }
        } else {
          setUser(model);
        }
      });

      // If there's an existing user, fetch expanded data
      if (pb.authStore.model) {
        (async () => {
          try {
            const expandedUser = await pb.collection("users").getOne(pb.authStore.model.id, {
              expand: 'branch_details,technician_details'
            });
            setUser(expandedUser);
          } catch (error) {
            console.error("Error fetching initial expanded user data:", error);
            setUser(pb.authStore.model); // Fallback to the basic model
          }
        })();
      }

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

      // Fetch the user with expanded branch_details and technician_details
      try {
        const expandedUser = await pb.collection("users").getOne(authData.record.id, {
          expand: 'branch_details,technician_details'
        });
        setUser(expandedUser);
        redirectUser(expandedUser.role);
        return expandedUser;
      } catch (error) {
        console.error("Error fetching expanded user data after login:", error);
        redirectUser(authData.record?.role);
        return authData.record;
      }
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

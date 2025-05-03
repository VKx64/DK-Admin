"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Assuming context is in @/context/AuthContext
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Optional: for notifications

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth(); // Get user and login function from context
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/"); // Redirect to dashboard or home page
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Login successful!");
        // Redirection is handled by the useEffect hook
      } else {
        // The login function in AuthContext should ideally handle setting specific errors
        // If not, set a generic one here or based on the return value if it provided more info
        setError("Invalid email or password.");
        toast.error("Login failed: Invalid credentials.");
      }
    } catch (err) {
      console.error("Login page error:", err);
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Don't render the form if the user is already known (avoids flash of content)
  if (authLoading || user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <div className="flex items-center justify-center h-full w-full bg-[url('/Images/default_user.jpg')] bg-cover bg-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email" // Changed to email type for better validation
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2 pb-5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page - Redirects to the Analytics dashboard
 *
 * This page serves as the entry point for the application and automatically
 * redirects users to the Analytics page. The Analytics navigation item in
 * the sidebar is the primary way to access the dashboard.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analytics");
  }, [router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <p>Redirecting to analytics...</p>
    </div>
  );
}

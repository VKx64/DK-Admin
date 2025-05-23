"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analytics");
  }, [router]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <p>Redirecting to analytics...</p>
      {/* You can add a loading spinner here if desired */}
    </div>
  );
}

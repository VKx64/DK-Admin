"use client";
import { useState } from "react";
import { getAllOrders } from "../services/pocketbase/readOrders";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [orderCount, setOrderCount] = useState(null);
  const [error, setError] = useState(null);

  const handleFetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const orders = await getAllOrders();
      console.log("Orders fetched successfully:", orders);
      setOrderCount(orders.length);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-blue-500 flex items-center justify-center">
    </div>
  );
}

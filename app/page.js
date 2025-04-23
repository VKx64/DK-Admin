"use client";
import { useState } from "react";
import { getAllOrders } from "../services/pocketbase/readOrders";

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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Daikin Admin Dashboard</h1>

      <button
        onClick={handleFetchOrders}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {loading ? "Loading..." : "Fetch All Orders"}
      </button>

      {orderCount !== null && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          Successfully fetched {orderCount} orders! Check the console for details.
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}

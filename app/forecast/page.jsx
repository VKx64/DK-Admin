"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Chart as ChartJS, TimeScale } from "chart.js";
import "chartjs-adapter-date-fns";
import DataChart from "@/components/v1/forecast/DataChart";
import ModelRetrain from "@/components/v1/forecast/ModelRetrain";

ChartJS.register(TimeScale);

const modelIdentifiers = [
  "part_stock_log",
  "product_stocks",
  "sales",
  "service_request_counts",
];

const formatModelNameForDisplay = (modelName) => {
  return modelName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const getModelAxisInfo = (modelName) => {
  if (modelName.includes("sales")) {
    return { unit: "$", yAxisLabel: "Amount ($)" };
  }
  if (modelName.includes("stock")) {
    return { unit: "units", yAxisLabel: "Stock Level (Units)" };
  }
  if (modelName.includes("counts")) {
    return { unit: "requests", yAxisLabel: "Number of Requests" };
  }
  return { unit: "", yAxisLabel: "Value" };
};

export default function Forecast() {
  const [modelsChartData, setModelsChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  // State for triggering updates - year and month inputs are now in ModelRetrain
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatuses, setUpdateStatuses] = useState([]);

  const fetchAllModelsData = async () => {
    setIsLoading(true);
    setGlobalError(null);
    setModelsChartData([]);

    const dataPromises = modelIdentifiers.map((modelName) =>
      Promise.all([
        axios.get(`http://localhost:5000/historical_data/${modelName}`),
        axios.get(`http://localhost:5000/forecast/${modelName}`),
      ])
        .then(([historicalRes, forecastRes]) => ({
          modelName,
          historicalData: Array.isArray(historicalRes.data)
            ? historicalRes.data
            : [],
          forecastData: Array.isArray(forecastRes.data) ? forecastRes.data : [],
          error: null,
        }))
        .catch((error) => {
          console.error(`Error fetching data for model ${modelName}:`, error);
          return {
            modelName,
            historicalData: [],
            forecastData: [],
            error: `Failed to load data for ${formatModelNameForDisplay(
              modelName
            )}.`,
          };
        })
    );

    try {
      const results = await Promise.all(dataPromises);
      setModelsChartData(results);
    } catch (error) {
      console.error("Unexpected error fetching all models data:", error);
      setGlobalError(
        "An unexpected error occurred while loading data for all models."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllModelsData();
  }, []);

  // Modified to accept year and month from ModelRetrain component
  const handleTriggerUpdates = async (year, month) => {
    setIsUpdating(true);
    setUpdateStatuses([]);

    const updatePromises = modelIdentifiers.map(async (modelName) => {
      try {
        const response = await axios.post(
          `http://localhost:5000/trigger_monthly_update/${modelName}`,
          { year, month } // Use year and month passed from ModelRetrain
        );
        return {
          modelName: formatModelNameForDisplay(modelName),
          status: "success",
          message: response.data.message || "Update triggered successfully.",
        };
      } catch (error) {
        return {
          modelName: formatModelNameForDisplay(modelName),
          status: "error",
          message:
            error.response?.data?.error ||
            `Failed to trigger update for ${formatModelNameForDisplay(
              modelName
            )}.`,
        };
      }
    });

    const results = await Promise.allSettled(updatePromises);

    const statuses = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          modelName: "Unknown Model",
          status: "error",
          message:
            result.reason?.message ||
            "An unexpected error occurred during update.",
        };
      }
    });
    setUpdateStatuses(statuses);
    setIsUpdating(false);

    alert(
      "Update process finished. Check statuses below. Re-fetching chart data..."
    );
    fetchAllModelsData();
  };

  const createChartOptions = (modelName, chartTitlePrefix) => {
    const { unit, yAxisLabel } = getModelAxisInfo(modelName);
    const formattedModelName = formatModelNameForDisplay(modelName);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 20,
            padding: 20,
            font: { size: 14 },
          },
          filter: chartTitlePrefix.toLowerCase().includes("forecast")
            ? (legendItem) => legendItem.text !== "Upper Bound (hidden)"
            : null,
        },
        title: {
          display: true,
          text: `${chartTitlePrefix} for ${formattedModelName}`,
          font: { size: 18, weight: "bold" },
          padding: { top: 10, bottom: 20 },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 4,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              const value = context.parsed.y;
              if (value === undefined || value === null) {
                return `${label}No data`;
              }
              if (unit === "$") {
                return `${label}${unit}${value.toFixed(2)}`;
              }
              return `${label}${value} ${unit}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero:
            modelName.includes("stock") || modelName.includes("counts"),
          title: {
            display: true,
            text: yAxisLabel,
            font: { size: 14, weight: "medium" },
            padding: { top: 0, bottom: 10 },
          },
          grid: { drawBorder: false },
          ticks: { padding: 10 },
        },
        x: {
          type: "time",
          time: {
            unit: "month",
            tooltipFormat: "MMM dd, yyyy",
            displayFormats: { month: "MMM yyyy" },
          },
          title: {
            display: true,
            text: "Date",
            font: { size: 14, weight: "medium" },
            padding: { top: 10, bottom: 0 },
          },
          grid: { display: false },
          ticks: { padding: 10, maxRotation: 0, autoSkipPadding: 20 },
        },
      },
      interaction: { intersect: false, mode: "index" },
    };
  };

  if (isLoading && !isUpdating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading all model data...</p>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="flex items-center justify-center h-screen p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="text-lg">{globalError}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen w-full overflow-auto">
      <ModelRetrain
        onTriggerUpdates={handleTriggerUpdates}
        isUpdating={isUpdating}
        updateStatuses={updateStatuses}
      />

      {/* Charts Section */}
      {modelsChartData.map(
        ({ modelName, historicalData, forecastData, error: modelError }) => {
          const formattedModelName = formatModelNameForDisplay(modelName);

          if (modelError) {
            return (
              <div
                key={modelName}
                className="mb-12 p-6 bg-red-50 border border-red-300 text-red-600 rounded-lg shadow-lg"
              >
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center">
                  {formattedModelName}
                </h2>
                <p className="text-md md:text-lg text-center">{modelError}</p>
              </div>
            );
          }

          if (!historicalData.length && !forecastData.length) {
            return (
              <div
                key={modelName}
                className="mb-12 p-6 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg shadow-lg"
              >
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center">
                  {formattedModelName}
                </h2>
                <p className="text-md md:text-lg text-center">
                  No data available for this model.
                </p>
              </div>
            );
          }

          const allLabels = [
            ...new Set([
              ...(historicalData || []).map((d) => d.ds),
              ...(forecastData || []).map((d) => d.ds),
            ]),
          ].sort((a, b) => new Date(a) - new Date(b));

          const currentHistoricalChartData = {
            labels: allLabels,
            datasets: [
              {
                label: `Actual ${formattedModelName}`,
                data: (historicalData || []).map((d) => ({ x: d.ds, y: d.y })),
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.3)",
                tension: 0.2,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
              },
            ],
          };

          const currentForecastChartData = {
            labels: allLabels,
            datasets: [
              {
                label: `${formattedModelName} Forecast`,
                data: (forecastData || []).map((d) => ({ x: d.ds, y: d.yhat })),
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.3)",
                tension: 0.2,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
              },
              {
                label: "Confidence Interval",
                data: (forecastData || []).map((d) => ({
                  x: d.ds,
                  y: d.yhat_lower,
                })),
                borderColor: "rgba(239, 68, 68, 0.3)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                pointRadius: 0,
                fill: "+1",
                tension: 0.2,
                borderWidth: 1,
                order: 1,
              },
              {
                label: "Upper Bound (hidden)",
                data: (forecastData || []).map((d) => ({
                  x: d.ds,
                  y: d.yhat_upper,
                })),
                borderColor: "rgba(239, 68, 68, 0.3)",
                pointRadius: 0,
                fill: false,
                tension: 0.2,
                borderWidth: 1,
              },
            ],
          };

          const historicalOptions = createChartOptions(
            modelName,
            "Historical Data"
          );
          const forecastOptions = createChartOptions(
            modelName,
            "Forecast Data"
          );

          return (
            <div
              key={modelName}
              className="mb-12 md:mb-16 p-4 md:p-6 bg-white rounded-xl shadow-2xl"
            >
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 text-center text-gray-800">
                {formattedModelName}
              </h2>
              {historicalData.length > 0 && (
                <div className="mb-8 md:mb-10">
                  <DataChart
                    chartData={currentHistoricalChartData}
                    chartOptions={historicalOptions}
                    height="350px"
                  />
                </div>
              )}
              {forecastData.length > 0 && (
                <div>
                  <DataChart
                    chartData={currentForecastChartData}
                    chartOptions={forecastOptions}
                    height="350px"
                  />
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

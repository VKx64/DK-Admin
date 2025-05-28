"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

const DataChart = ({ chartData, chartOptions, height = "400px" }) => {
  if (
    !chartData ||
    !chartData.datasets ||
    chartData.datasets.every((ds) => !ds.data || ds.data.length === 0)
  ) {
  }

  return (
    <div style={{ height: height, width: "100%" }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default DataChart;

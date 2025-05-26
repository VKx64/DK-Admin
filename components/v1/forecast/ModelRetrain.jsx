"use client";
import { useState, useEffect } from "react";

const ModelRetrain = ({
  onTriggerUpdates,
  isUpdating,
  updateStatuses,
  initialYear,
  initialMonth,
}) => {
  const [updateYear, setUpdateYear] = useState(
    initialYear || new Date().getFullYear().toString()
  );
  const [updateMonth, setUpdateMonth] = useState(
    initialMonth || (new Date().getMonth() + 1).toString()
  );
  const [isFirstDayOfMonth, setIsFirstDayOfMonth] = useState(false);

  useEffect(() => {
    const today = new Date();
    setIsFirstDayOfMonth(today.getDate() === 1);
  }, []);

  const handleUpdateClick = () => {
    if (!updateYear || !updateMonth) {
      alert("Please enter both year and month.");
      return;
    }
    const year = parseInt(updateYear);
    const month = parseInt(updateMonth);

    if (
      isNaN(year) ||
      isNaN(month) ||
      month < 1 ||
      month > 12 ||
      year < 2000 ||
      year > 2100
    ) {
      alert("Please enter a valid year (e.g., 2024) and month (1-12).");
      return;
    }
    onTriggerUpdates(year, month);
  };

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md justify-center flex items-center flex-col">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Trigger Monthly Data Update
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
        <div>
          <label
            htmlFor="updateYear"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Year (YYYY)
          </label>
          <input
            type="number"
            id="updateYear"
            value={updateYear}
            onChange={(e) => setUpdateYear(e.target.value)}
            placeholder="e.g., 2024"
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm w-full sm:w-auto"
            disabled={isUpdating || !isFirstDayOfMonth}
          />
        </div>
        <div>
          <label
            htmlFor="updateMonth"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Month (1-12)
          </label>
          <input
            type="number"
            id="updateMonth"
            value={updateMonth}
            onChange={(e) => setUpdateMonth(e.target.value)}
            placeholder="e.g., 5 for May"
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm w-full sm:w-auto"
            min="1"
            max="12"
            disabled={isUpdating || !isFirstDayOfMonth}
          />
        </div>
        <button
          onClick={handleUpdateClick}
          disabled={isUpdating || !isFirstDayOfMonth}
          className={`px-4 py-2 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out ${
            isUpdating || !isFirstDayOfMonth
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          }`}
          title={
            !isFirstDayOfMonth
              ? "Updates can only be triggered on the 1st day of the month."
              : ""
          }
        >
          {isUpdating ? "Updating..." : "Fetch & Retrain All Models"}
        </button>
      </div>
      {!isFirstDayOfMonth && (
        <p className="text-sm text-orange-600 mb-2">
          Note: Data updates can only be triggered on the 1st day of the month.
        </p>
      )}
      {isUpdating && (
        <p className="text-sm text-blue-600">
          Processing updates, please wait...
        </p>
      )}
      {updateStatuses && updateStatuses.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-md font-semibold text-gray-600">
            Update Statuses:
          </h3>
          <ul className="list-disc list-inside pl-4 max-h-40 overflow-y-auto">
            {updateStatuses.map((status, index) => (
              <li
                key={index}
                className={`text-sm ${
                  status.status === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <strong>{status.modelName}:</strong> {status.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelRetrain;

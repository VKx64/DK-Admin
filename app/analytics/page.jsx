"use client";
import React, { useState, useMemo, useEffect } from "react";
import pb from "@/services/pocketbase";
import { Icon } from "@iconify/react";

import StatCard from "@/components/v1/analytics/StatCard";
import PaymentMethodsCard from "@/components/v1/analytics/PaymentMethodsCard";
import TopBrandsCard from "@/components/v1/analytics/TopBrandsCard";
import UserRegistrationsTrendCard from "@/components/v1/analytics/UserRegistrationsTrendCard";
import ServiceRequestsTrendCard from "@/components/v1/analytics/ServiceRequestsTrendCard";
import RevenueTrendCard from "@/components/v1/analytics/RevenueTrendCards";
import UserRolesCard from "@/components/v1/analytics/UserRolesCard";
import ServiceRequestStatusCard from "@/components/v1/analytics/ServiceRequestStatusCard";
import TopProductsByStockCard from "@/components/v1/analytics/TopProductsByStockCard";
import TechnicianPerformanceList from "@/components/v1/analytics/TechnicianPerformanceList";
import BestSellingProductService from "@/components/v1/analytics/BestSellingProductService";
import RevenueByStock from "@/components/v1/analytics/RevenueByStock";
import InventoryForecast from "@/components/v1/analytics/InventoryForecast";
import InventoryAnalytics from "@/components/v1/analytics/InventoryAnalytics";

// Define PIE_COLORS for Pie Charts, to be passed to relevant card components
const PIE_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1919",
  "#4BC0C0",
  "#9966FF",
];

const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [selectedView, setSelectedView] = useState("overview");
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [parts, setParts] = useState([]);
  const [products, setProducts] = useState([]);
  const [partStockLogs, setPartStockLogs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [productStocks, setProductStocks] = useState([]);
  const [productPricings, setProductPricings] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {      const [
        users,
        services,
        ordersRes,
        partsRes,
        productsRes,
        logs,
        productStocksRes,
        productPricingsRes,
        branchesRes,
      ] = await Promise.all([
        pb.collection("users").getFullList({ requestKey: null }),
        pb.collection("service_request").getFullList({ requestKey: null }),
        pb.collection("user_order").getFullList({ requestKey: null }),
        pb.collection("parts").getFullList({ requestKey: null }),
        pb.collection("products").getFullList({ requestKey: null }),
        pb.collection("part_stock_log").getFullList({ requestKey: null }),
        pb.collection("product_stocks").getFullList({ requestKey: null }),
        pb.collection("product_pricing").getFullList({ requestKey: null }),
        pb.collection("branch_details").getFullList({ requestKey: null }),
      ]);

      console.log("Fetched users:", users);
      console.log("Fetched service requests:", services);
      console.log("Fetched orders:", ordersRes);
      console.log("Fetched parts:", partsRes);
      console.log("Fetched products:", productsRes);
      console.log("Fetched part stock logs:", logs);
      console.log("Fetched product stocks:", productStocksRes);
      console.log("Fetched product pricings:", productPricingsRes);
      console.log("Fetched branches:", branchesRes);

      const techs = users.filter((u) => u.role === "technician");
      console.log("Filtered technicians:", techs);

      setUserRegistrations(users);
      setServiceRequests(services);
      setOrders(ordersRes);
      setParts(partsRes);
      setProducts(productsRes);
      setPartStockLogs(logs);
      setTechnicians(techs);
      setProductStocks(productStocksRes);
      setProductPricings(productPricingsRes);
      setBranches(branchesRes);
    };

    fetchData();
  }, [selectedPeriod]);

  const bestSellingCombos = useMemo(() => {
    if (!serviceRequests.length) return [];

    const combos = serviceRequests.reduce((acc, record) => {
      const key = `${record.product} - ${record.problem}`;
      if (acc[key]) {
        acc[key].count += 1;
      } else {
        acc[key] = {
          product: record.product,
          service: record.problem,
          count: 1,
        };
      }
      return acc;
    }, {});

    return Object.values(combos).sort((a, b) => b.count - a.count);
  }, [serviceRequests]);

  const revenueByStockData = useMemo(() => {
    if (!orders.length || !products.length || !productPricings.length) {
      return [];
    }

    const productPriceMap = productPricings.reduce((acc, pricing) => {
      acc[pricing.product_id] = pricing.final_price || 0;
      return acc;
    }, {});

    const revenueMap = orders.reduce((acc, order) => {
      if (order.products) {
        order.products.forEach((productId) => {
          const price = productPriceMap[productId] || 0;
          acc[productId] = (acc[productId] || 0) + price;
        });
      }
      return acc;
    }, {});

    const enrichedData = Object.entries(revenueMap)
      .map(([productId, revenue]) => {
        const product = products.find((p) => p.id === productId);
        return {
          name: product ? product.product_name : `Product ID: ${productId}`,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return enrichedData;
  }, [orders, products, productPricings]);

  // Inventory Forecasting Data
  const inventoryForecastData = useMemo(() => {
    console.log("Inventory Forecast Debug:", {
      ordersLength: orders.length,
      productsLength: products.length,
      productStocksLength: productStocks.length,
      sampleOrder: orders[0],
      sampleProduct: products[0],
      sampleProductStock: productStocks[0]
    });

    // Create mock data if no real data is available for demonstration
    if (!products.length) {
      return [];
    }

    // Create sample forecast data using available products
    const mockForecastData = [];
    const periods = ['Current', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];

    // Use first few products for demonstration
    const sampleProducts = products.slice(0, 5);

    periods.forEach((period, index) => {
      mockForecastData.push({
        period,
        currentStock: index === 0 ? 100 - (index * 15) : null,
        predictedStock: index > 0 ? Math.max(10, 100 - (index * 20)) : null,
        reorderPoint: 25,
      });
    });

    // Add product summary for table
    const productSummary = sampleProducts.map((product, index) => ({
      product: product.product_name || `Product ${product.id}`,
      daysToReorder: 14 - (index * 3), // Mock days to reorder
      riskLevel: index <= 1 ? 'High' : index <= 3 ? 'Medium' : 'Low'
    }));

    return mockForecastData.concat(productSummary);
  }, [orders, products, productStocks]);

  // Dynamic KPI Calculations
  const kpiData = useMemo(
    () => ({
      totalUsers: userRegistrations.length,
      activeServiceRequests: serviceRequests.filter((req) =>
        ["pending", "scheduled", "in_progress"].includes(req.status)
      ).length,
      monthlyRevenue: orders.reduce(
        (acc, order) => acc + (order.delivery_fee || 0),
        0
      ),
      totalPartsStock: parts.reduce((acc, part) => acc + (part.stocks || 0), 0),
    }),
    [userRegistrations, serviceRequests, orders, parts]
  );

  // Payment Methods Distribution
  const paymentMethods = useMemo(() => {
    if (!orders.length) return [];
    const methods = {};
    orders.forEach((order) => {
      const method = order.mode_of_payment || "Unknown";
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Top Brands Calculation
  const topBrands = useMemo(() => {
    if (!products.length) return [];
    const brandCounts = products.reduce((acc, product) => {
      if (product.brand) {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  // Technician Performance Data
  const technicianPerformance = useMemo(() => {
    // Pre-calculate completed jobs per technician for efficiency
    const completedJobsByTechnician = serviceRequests.reduce((acc, req) => {
      if (req.status === "completed" && req.assigned_technician) {
        acc[req.assigned_technician] = (acc[req.assigned_technician] || 0) + 1;
      }
      return acc;
    }, {});

    return technicians
      .map((tech) => ({
        name: tech.name || tech.email,
        completedJobs: completedJobsByTechnician[tech.id] || 0,
        specialization: tech.technician_details?.specialization || "General",
      }))
      .filter((t) => t.completedJobs > 0)
      .sort((a, b) => b.completedJobs - a.completedJobs);
  }, [technicians, serviceRequests]);

  // Registration Trends (users per day)
  const registrationTrends = useMemo(() => {
    if (!userRegistrations.length) return [];
    const counts = {};
    userRegistrations.forEach((user) => {
      if (user.created) {
        const date = new Date(user.created).toLocaleDateString();
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [userRegistrations]);

  // Service Requests Trends (requests per day)
  const serviceRequestTrends = useMemo(() => {
    if (!serviceRequests.length) return [];
    const counts = {};
    serviceRequests.forEach((req) => {
      if (req.created) {
        const date = new Date(req.created).toLocaleDateString();
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [serviceRequests]);

  // Revenue Trends (sum of delivery_fee per day)
  const revenueTrends = useMemo(() => {
    if (!orders.length) return [];
    const sums = {};
    orders.forEach((order) => {
      if (order.created) {
        const date = new Date(order.created).toLocaleDateString();
        sums[date] = (sums[date] || 0) + (order.delivery_fee || 0);
      }
    });
    return Object.entries(sums)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [orders]);

  // User Roles Distribution
  const userRolesDistribution = useMemo(() => {
    if (!userRegistrations.length) return [];
    const roles = {};
    userRegistrations.forEach((user) => {
      const role = user.role || "Unknown";
      roles[role] = (roles[role] || 0) + 1;
    });
    return Object.entries(roles).map(([name, value]) => ({ name, value }));
  }, [userRegistrations]);

  // Service Request Status Distribution
  const serviceRequestStatusDistribution = useMemo(() => {
    if (!serviceRequests.length) return [];
    const statuses = {};
    serviceRequests.forEach((req) => {
      const status = req.status || "Unknown";
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [serviceRequests]);

  // Top 5 Products by Stock
  const topProductsByStock = useMemo(() => {
    if (!products.length || !productStocks.length) return [];

    const productStockMap = productStocks.reduce((acc, stockEntry) => {
      acc[stockEntry.product_id] =
        (acc[stockEntry.product_id] || 0) + (stockEntry.stock_quantity || 0);
      return acc;
    }, {});

    const enrichedProducts = products
      .map((product) => ({
        name: product.product_name || `Product ID: ${product.id}`,
        stock: productStockMap[product.id] || 0,
      }))
      .filter((p) => p.stock > 0);

    return enrichedProducts.sort((a, b) => b.stock - a.stock).slice(0, 5);
  }, [products, productStocks]);

  return (
    <main className="min-h-screen bg-gray-50 p-6 w-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              Analytics Dashboard
            </h2>

            {/* View Selector */}
            <div className="flex items-center gap-4">
              <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                <button
                  onClick={() => setSelectedView("overview")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === "overview"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setSelectedView("inventory")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === "inventory"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setSelectedView("services")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === "services"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Services
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content based on selected view */}
        {selectedView === "overview" && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={kpiData.totalUsers}
                icon={<Icon icon="mdi:account-group" width="32" height="32" />}
                color="#3b82f6"
              />
              <StatCard
                title="Active Service Requests"
                value={kpiData.activeServiceRequests}
                icon={<Icon icon="mdi:wrench" width="32" height="32" />}
                color="#10b981"
              />
              <StatCard
                title="Total Revenue (from period)"
                value={`₱${kpiData.monthlyRevenue.toLocaleString()}`}
                icon={<Icon icon="mdi:currency-usd" width="32" height="32" />}
                color="#8b5cf6"
              />
              <StatCard
                title="Total Parts in Stock"
                value={kpiData.totalPartsStock.toLocaleString()}
                icon={<Icon icon="mdi:package-variant" width="32" height="32" />}
                color="#f59e0b"
              />
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <UserRegistrationsTrendCard data={registrationTrends} />
              <ServiceRequestsTrendCard data={serviceRequestTrends} />
              <RevenueTrendCard data={revenueTrends} />
            </div>

            {/* Charts Section - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <UserRolesCard data={userRolesDistribution} PIE_COLORS={PIE_COLORS} />
              <ServiceRequestStatusCard
                data={serviceRequestStatusDistribution}
                PIE_COLORS={PIE_COLORS}
              />
              <TopProductsByStockCard data={topProductsByStock} />
            </div>

            {/* Additional Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <PaymentMethodsCard data={paymentMethods} PIE_COLORS={PIE_COLORS} />
              <TopBrandsCard data={topBrands} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <BestSellingProductService data={bestSellingCombos} />
              <RevenueByStock data={revenueByStockData} />
            </div>

            {/* Inventory Forecasting Section */}
            <div className="mt-6">
              <InventoryForecast data={inventoryForecastData} />
            </div>
          </>
        )}

        {/* Inventory View */}
        {selectedView === "inventory" && (
          <InventoryAnalytics
            products={products}
            productStocks={productStocks}
            branches={branches}
            parts={parts}
            partStockLogs={partStockLogs}
          />
        )}

        {/* Services View */}
        {selectedView === "services" && (
          <TechnicianPerformanceList technicians={technicians} serviceRequests={serviceRequests} />
        )}
      </div>
    </main>
  );
};

export default AnalyticsPage;

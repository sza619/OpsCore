import { useEffect, useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Users, AlertCircle, TrendingUp } from "lucide-react";
import { apiClient } from "../../api/client";
import { getSocket } from "../../api/socket";
import { AuditLog, Role, SystemAlert } from "../../types";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MotionCard = motion.div;

const StatCard = memo(({ icon: Icon, label, value, color }: any) => (
  <MotionCard
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ duration: 0.4 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
  >
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            <CountUp end={value} duration={1.5} separator="," />
            {/* <span className="text-xs text-green-500 font-medium">
              +4.2% this week
            </span> */}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  </MotionCard>
));

StatCard.displayName = "StatCard";

export const Dashboard = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [requestsPerMinute, setRequestsPerMinute] = useState(0);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/dashboard");
      return data.data;
    },
  });

  const growthData = dashboardData?.userActivity?.daily || [];

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on("activeUsers", (count: number) => {
      setActiveUsers(count);
    });

    socket.on("requestsPerMinute", (count: number) => {
      setRequestsPerMinute(count);
    });

    socket.on("auditLogs", (logs: AuditLog[]) => {
      setRecentLogs(logs.slice(0, 10));
    });

    socket.on("systemAlert", (alert: SystemAlert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 5));
    });

    return () => {
      socket.off("activeUsers");
      socket.off("requestsPerMinute");
      socket.off("auditLogs");
      socket.off("systemAlert");
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Active Users"
          value={activeUsers}
          color="bg-blue-600"
        />
        <StatCard
          icon={Activity}
          label="Requests/Min"
          value={requestsPerMinute}
          color="bg-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Users"
          value={dashboardData?.userActivity?.totalUsers || 0}
          color="bg-orange-600"
        />
        <StatCard
          icon={AlertCircle}
          label="Total Logs"
          value={dashboardData?.systemStats?.totalLogs || 0}
          color="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Live Activity Feed
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Waiting for activity...
                </p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        log.status === "success" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {log.action}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {log.user?.name || "System"} - {log.resource}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System Alerts
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No alerts at this time
                </p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.severity === "warning"
                        ? "bg-yellow-50 border-yellow-200 dark:bg-blue-900 dark:border-blue-700"
                        : "bg-blue-50 border-blue-200 dark:bg-gray-900 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={20}
                        className={
                          alert.severity === "warning"
                            ? "text-yellow-600 dark:text-white"
                            : "text-blue-600"
                        }
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-400">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <ResponsiveContainer width="100%" height={250}>
        <LineChart data={growthData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      <PieChart width={250} height={250}>
        <Pie
          data={dashboardData?.roles}
          dataKey="count"
          nameKey="name"
          outerRadius={90}
        >
          {dashboardData?.roles?.map((_: Role, index: number) => (
            <Cell key={index} />
          ))}
        </Pie>
      </PieChart> */}
    </div>
  );
};

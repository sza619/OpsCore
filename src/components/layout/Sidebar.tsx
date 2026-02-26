import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { usePermission } from "../../hooks/usePermission";

const navItems = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    permission: "dashboard:view",
  },
  { to: "/users", icon: Users, label: "Users", permission: "users:read" },
  {
    to: "/roles",
    icon: Shield,
    label: "Roles & Permissions",
    permission: "roles:read",
  },
  {
    to: "/audit",
    icon: FileText,
    label: "Audit Logs",
    permission: "logs:read",
  },
  {
    to: "/analytics",
    icon: BarChart3,
    label: "Analytics",
    permission: "analytics:view",
  },
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    permission: "settings:read",
  },
];

export const Sidebar = memo(() => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { hasPermission } = usePermission();

  const filteredNavItems = navItems.filter((item) =>
    hasPermission(item.permission),
  );

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col dark:bg-gray-950">
      <div className="p-6 flex items-center justify-between border-b border-gray-800">
        <h1 className="text-2xl font-bold">OpsCore</h1>
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-800 rounded transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
        <p>OpsCore v1.0.0</p>
        <p className="mt-1">Production-Ready SaaS Platform</p>
      </div>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

import { memo } from "react";
import { Menu, LogOut, User, Moon, Sun } from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { useAuth } from "../../hooks/useAuth";
import { useThemeStore } from "../../stores/themeStore";

export const Topbar = memo(() => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <User size={18} className="text-gray-600 dark:text-gray-400" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user?.name}
              </p>
              <p className="text-gray-500 text-xs">{user?.roles[0]?.name}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
});

Topbar.displayName = "Topbar";

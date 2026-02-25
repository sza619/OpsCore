import { useAuthStore } from "../stores/authStore";

export const usePermission = () => {
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // ADMIN OVERRIDE
    if (user.roles?.some((role) => role.name === "admin")) {
      return true;
    }

    return user.permissions?.includes(permission);
  };

  return { hasPermission };
};

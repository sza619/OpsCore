import { useAuthStore } from '../stores/authStore';

export const usePermission = () => {
  const { hasPermission } = useAuthStore();
  return { hasPermission };
};

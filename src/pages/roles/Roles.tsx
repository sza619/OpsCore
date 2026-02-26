import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, CheckCircle } from "lucide-react";
import { apiClient } from "../../api/client";
import { Role, Permission } from "../../types";

const RoleCard = memo(({ role }: { role: Role }) => {
  const permissions = role.rolePermissions?.map((rp) => rp.permission) || [];
  const userCount = role._count?.userRoles || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Shield size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {role.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {role.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <Users size={16} />
        <span>{userCount} users</span>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">
          Permissions:
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {permissions.map((permission: Permission) => (
            <div
              key={permission.id}
              className="flex items-center gap-2 text-sm"
            >
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-gray-700 dark:text-gray-400">
                {permission.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

RoleCard.displayName = "RoleCard";

export const Roles = () => {
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await apiClient.get("/roles");
      return data.data;
    },
  });

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await apiClient.get("/roles/permissions");
      return data.data;
    },
  });

  const isLoading = rolesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const permissionsByCategory = (permissionsData || []).reduce(
    (acc: any, permission: Permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Roles & Permissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage access control and permissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Roles
          </h2>
          {rolesData?.map((role: Role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Available Permissions
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(
                ([category, permissions]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {permissions.map((permission: Permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <CheckCircle
                            size={16}
                            className="text-blue-600 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {permission.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

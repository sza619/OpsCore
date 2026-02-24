import { useState, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { apiClient } from '../../api/client';
import { usePermission } from '../../hooks/usePermission';
import { toast } from 'react-toastify';
import { User } from '../../types';

const UserRow = memo(({ user, onEdit, onDelete, canUpdate, canDelete }: any) => (
  <tr className="border-b border-gray-200 hover:bg-gray-50">
    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
    <td className="px-6 py-4">
      <div className="flex gap-2">
        {user.roles?.map((role: any) => (
          <span
            key={role.id}
            className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
          >
            {role.name}
          </span>
        ))}
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-600">
      {user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleDateString()
        : 'Never'}
    </td>
    <td className="px-6 py-4">
      <div className="flex gap-2">
        {canUpdate && (
          <button
            onClick={() => onEdit(user)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(user)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </td>
  </tr>
));

UserRow.displayName = 'UserRow';

export const Users = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/users?page=${page}&limit=50`);
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        {canCreate && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Add User</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {usersData?.users?.map((user: User) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {usersData?.users?.length || 0} of {usersData?.total || 0} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!usersData?.users || usersData.users.length < 50}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

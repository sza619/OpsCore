import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { apiClient } from '../../api/client';

const MetricCard = memo(({ icon: Icon, label, value, change, color }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {change && (
        <span
          className={`text-sm font-semibold ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change > 0 ? '+' : ''}
          {change}%
        </span>
      )}
    </div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
));

MetricCard.displayName = 'MetricCard';

export const Analytics = () => {
  const { data: userActivity } = useQuery({
    queryKey: ['analytics', 'users'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/users');
      return data.data;
    },
  });

  const { data: roleDistribution } = useQuery({
    queryKey: ['analytics', 'roles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/roles');
      return data.data;
    },
  });

  const { data: requestStats } = useQuery({
    queryKey: ['analytics', 'requests'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/requests');
      return data.data;
    },
  });

  const { data: systemStats } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/stats');
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">System performance and usage metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={userActivity?.totalUsers || 0}
          color="bg-blue-600"
        />
        <MetricCard
          icon={Activity}
          label="Active Users (24h)"
          value={userActivity?.activeUsers || 0}
          color="bg-green-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Recent Logins (7d)"
          value={userActivity?.recentLogins || 0}
          color="bg-orange-600"
        />
        <MetricCard
          icon={Clock}
          label="Avg Response Time"
          value={`${Math.round(systemStats?.avgResponseTime || 0)}ms`}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Role Distribution</h2>
          <div className="space-y-4">
            {roleDistribution?.map((role: any) => {
              const total = roleDistribution.reduce((sum: number, r: any) => sum + r._count.userRoles, 0);
              const percentage = total > 0 ? (role._count.userRoles / total) * 100 : 0;

              return (
                <div key={role.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{role.name}</span>
                    <span className="text-sm text-gray-600">
                      {role._count.userRoles} users ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top API Endpoints</h2>
          <div className="space-y-4">
            {requestStats?.slice(0, 8).map((stat: any, index: number) => (
              <div
                key={`${stat.endpoint}-${stat.method}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {stat.method}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{stat.endpoint}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Avg: {Math.round(stat._avg.duration || 0)}ms
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{stat._count._all}</p>
                  <p className="text-xs text-gray-500">requests</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <p className="text-sm text-blue-700 font-medium mb-2">Total Audit Logs</p>
            <p className="text-4xl font-bold text-blue-900">
              {systemStats?.totalLogs?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <p className="text-sm text-green-700 font-medium mb-2">Total Requests</p>
            <p className="text-4xl font-bold text-green-900">
              {systemStats?.totalRequests?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <p className="text-sm text-purple-700 font-medium mb-2">Avg Response</p>
            <p className="text-4xl font-bold text-purple-900">
              {Math.round(systemStats?.avgResponseTime || 0)}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

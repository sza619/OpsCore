import { useState, memo, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import { apiClient } from '../../api/client';
import { AuditLog } from '../../types';

const LogRow = memo(({ log }: { log: AuditLog }) => (
  <div className="border-b border-gray-200 hover:bg-gray-50 px-6">
    <div className="flex items-center gap-4 py-4">
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <div className="flex-1 min-w-0 grid grid-cols-4 gap-4">
        <div className="truncate">
          <p className="text-sm font-medium text-gray-900 truncate">{log.action}</p>
          <p className="text-xs text-gray-500 truncate">{log.resource}</p>
        </div>
        <div className="truncate">
          <p className="text-sm text-gray-600 truncate">{log.user?.name || 'System'}</p>
          <p className="text-xs text-gray-500 truncate">{log.user?.email || '-'}</p>
        </div>
        <div className="truncate">
          <p className="text-sm text-gray-600 truncate">{log.details || '-'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {new Date(log.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(log.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  </div>
));

LogRow.displayName = 'LogRow';

export const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(100);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['auditLogs', debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/audit?limit=10000&search=${encodeURIComponent(debouncedSearch)}`
      );
      return data.data;
    },
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const displayedLogs = useMemo(() => {
    return logsData?.logs?.slice(0, displayLimit) || [];
  }, [logsData, displayLimit]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;

    if (scrollPercentage > 0.8 && displayLimit < (logsData?.logs?.length || 0)) {
      setDisplayLimit(prev => Math.min(prev + 100, logsData?.logs?.length || 0));
    }
  }, [displayLimit, logsData]);

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
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            Viewing {logsData?.logs?.length || 0} of {logsData?.total || 0} logs
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search logs by action, resource, or details..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            <div>Action / Resource</div>
            <div>User</div>
            <div>Details</div>
            <div className="text-right">Timestamp</div>
          </div>
        </div>

        {logsData?.logs && logsData.logs.length > 0 ? (
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '600px' }}
            onScroll={handleScroll}
          >
            {displayedLogs.map((log: AuditLog) => (
              <LogRow key={log.id} log={log} />
            ))}
            {displayLimit < (logsData?.logs?.length || 0) && (
              <div className="p-4 text-center text-sm text-gray-500">
                Scroll down to load more... ({displayLimit} of {logsData.logs.length})
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No audit logs found
          </div>
        )}
      </div>
    </div>
  );
};

import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ColdStartBanner = ({ show }: { show: boolean }) => {
  const { coldStartBannerDismissed, dismissColdStartBanner } = useUIStore();

  if (!show || coldStartBannerDismissed) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" />
        <p className="text-sm">
          Backend runs on Render free tier. First request may take 30-60 seconds due to cold start.
        </p>
      </div>
      <button
        onClick={dismissColdStartBanner}
        className="hover:bg-blue-700 p-1 rounded transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useUIStore } from '../stores/uiStore';

export const useColdStart = () => {
  const [isColdStart, setIsColdStart] = useState(false);
  const { coldStartBannerDismissed } = useUIStore();

  useEffect(() => {
    let hasShownToast = false;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        if (duration > 3000 && !hasShownToast && !coldStartBannerDismissed) {
          setIsColdStart(true);
          hasShownToast = true;
          toast.info(
            'Backend is waking up from cold start. This may take 30-60 seconds.',
            { autoClose: 8000 }
          );
        }

        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [coldStartBannerDismissed]);

  return { isColdStart };
};

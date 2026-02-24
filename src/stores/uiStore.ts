import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  coldStartBannerDismissed: boolean;
  toggleSidebar: () => void;
  dismissColdStartBanner: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  coldStartBannerDismissed: localStorage.getItem('coldStartBannerDismissed') === 'true',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  dismissColdStartBanner: () => {
    localStorage.setItem('coldStartBannerDismissed', 'true');
    set({ coldStartBannerDismissed: true });
  },
}));

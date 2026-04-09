/**
 * Metadata Panel Store
 * UI state for the persistent metadata side panel.
 * Actual data lives in side-canal-store.responseMetadata (already accumulated).
 */

import { create } from 'zustand';

interface MetadataPanelState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useMetadataPanelStore = create<MetadataPanelState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

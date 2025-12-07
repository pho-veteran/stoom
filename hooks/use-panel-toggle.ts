"use client";

import { useState, useCallback, useEffect } from "react";

export type PanelType = "screenShare" | "whiteboard" | "videoFeeds";

const MAX_VISIBLE_PANELS = 2;
const STORAGE_KEY = "stoom-panel-preferences";

interface PanelState {
  screenShare: boolean;
  whiteboard: boolean;
  videoFeeds: boolean;
}

interface UsePanelToggleReturn {
  panels: PanelState;
  togglePanel: (panel: PanelType) => void;
  showPanel: (panel: PanelType) => void;
  hidePanel: (panel: PanelType) => void;
  getVisiblePanels: () => PanelType[];
  visibleCount: number;
}

export function usePanelToggle(
  initialState?: Partial<PanelState>
): UsePanelToggleReturn {
  const [panels, setPanels] = useState<PanelState>({
    screenShare: initialState?.screenShare ?? true,
    whiteboard: initialState?.whiteboard ?? false,
    videoFeeds: initialState?.videoFeeds ?? false,
  });

  const [preferredOrder, setPreferredOrder] = useState<PanelType[]>([
    "screenShare",
    "whiteboard",
    "videoFeeds",
  ]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { order } = JSON.parse(saved);
          if (order) {
            setPreferredOrder(order);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    loadPreferences();
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((order: PanelType[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ order }));
  }, []);

  const getVisiblePanels = useCallback((): PanelType[] => {
    const visible: PanelType[] = [];
    if (panels.screenShare) visible.push("screenShare");
    if (panels.whiteboard) visible.push("whiteboard");
    if (panels.videoFeeds) visible.push("videoFeeds");
    return visible;
  }, [panels]);

  const togglePanel = useCallback(
    (panel: PanelType) => {
      setPanels((prev) => {
        const newState = { ...prev };
        const isCurrentlyVisible = prev[panel];

        if (isCurrentlyVisible) {
          // Simply hide the panel
          newState[panel] = false;
        } else {
          // Check how many panels are currently visible
          const visiblePanels = getVisiblePanels();

          if (visiblePanels.length >= MAX_VISIBLE_PANELS) {
            // Need to hide one panel before showing the new one
            // Hide the least preferred panel (last in preferred order that's visible)
            const panelToHide = preferredOrder
              .filter((p) => visiblePanels.includes(p) && p !== panel)
              .pop();

            if (panelToHide) {
              newState[panelToHide] = false;
            }
          }

          newState[panel] = true;

          // Update preferred order - move toggled panel to front
          const newOrder = [panel, ...preferredOrder.filter((p) => p !== panel)];
          setPreferredOrder(newOrder);
          savePreferences(newOrder);
        }

        return newState;
      });
    },
    [getVisiblePanels, preferredOrder, savePreferences]
  );

  const showPanel = useCallback(
    (panel: PanelType) => {
      if (!panels[panel]) {
        togglePanel(panel);
      }
    },
    [panels, togglePanel]
  );

  const hidePanel = useCallback((panel: PanelType) => {
    setPanels((prev) => ({
      ...prev,
      [panel]: false,
    }));
  }, []);

  return {
    panels,
    togglePanel,
    showPanel,
    hidePanel,
    getVisiblePanels,
    visibleCount: getVisiblePanels().length,
  };
}

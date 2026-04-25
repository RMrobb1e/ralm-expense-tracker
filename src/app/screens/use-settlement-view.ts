import { useCallback, useState } from "react";

type SettlementView = "simplified" | "traditional";

export function useSettlementView() {
  const [view, setViewState] = useState<SettlementView>("simplified");

  const setView = useCallback((newView: SettlementView) => {
    // Add defensive programming and logging
    try {
      console.log("Switching settlement view to:", newView);

      // Validate the new view
      if (newView !== "simplified" && newView !== "traditional") {
        console.error("Invalid settlement view:", newView);
        return;
      }

      // Use requestAnimationFrame to ensure navigation context is stable
      requestAnimationFrame(() => {
        setViewState(newView);
        console.log("Settlement view switched to:", newView);
      });
    } catch (err) {
      console.error("Error changing settlement view:", err);
    }
  }, []);

  return {
    view,
    setView,
  };
}

import { useEffect, useState } from "react";

import { getDatabase, initializeDatabase, logDatabaseSnapshot } from "@/db/client";

type UseDatabaseResult = {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
};

export function useDatabase(): UseDatabaseResult {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await initializeDatabase();
        await getDatabase();
        if (__DEV__) {
          await logDatabaseSnapshot();
        }

        if (!isMounted) return;
        setIsReady(true);
      } catch (initError: unknown) {
        if (!isMounted) return;
        const message =
          initError instanceof Error ? initError.message : "Failed to initialize database";
        setError(message);
      } finally {
        if (!isMounted) return;
        setIsInitializing(false);
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isReady,
    isInitializing,
    error,
  };
}

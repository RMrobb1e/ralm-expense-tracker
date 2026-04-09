import { useCallback, useEffect, useState } from "react";

import { createEvent, deleteEvent, listEvents, updateEvent } from "@/db/client";
import type {
  CreateEventInput,
  EventItem,
  UpdateEventInput,
} from "@/features/events/types/event.types";

type UseEventsResult = {
  events: EventItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEvent: (input: CreateEventInput) => Promise<void>;
  editEvent: (input: UpdateEventInput) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
};

export function useEvents(enabled: boolean): UseEventsResult {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await listEvents();
      setEvents(data);
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load events";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEvent = useCallback(async (input: CreateEventInput) => {
    await createEvent(input);
    await refresh();
  }, [refresh]);

  const editEvent = useCallback(
    async (input: UpdateEventInput) => {
      await updateEvent(input);
      await refresh();
    },
    [refresh]
  );

  const removeEvent = useCallback(
    async (eventId: string) => {
      await deleteEvent(eventId);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return {
    events,
    isLoading,
    error,
    refresh,
    addEvent,
    editEvent,
    removeEvent,
  };
}

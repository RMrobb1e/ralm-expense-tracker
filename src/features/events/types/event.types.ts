export type EventItem = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

export type CreateEventInput = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

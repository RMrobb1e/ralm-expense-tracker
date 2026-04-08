export type EntityId = string;

export type ISODateString = string;

export type Event = {
  id: EntityId;
  name: string;
  description: string | null;
  startDate: ISODateString;
  endDate: ISODateString | null;
  createdAt: ISODateString;
};

export type Participant = {
  id: EntityId;
  eventId: EntityId;
  name: string;
  email: string | null;
  createdAt: ISODateString;
};

export type Expense = {
  id: EntityId;
  eventId: EntityId;
  participantId: EntityId | null;
  title: string;
  amount: number;
  currency: string;
  incurredAt: ISODateString;
  notes: string | null;
  createdAt: ISODateString;
};

export type DatabaseColumnInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

export type DatabaseTableSnapshot = {
  table: string;
  columns: DatabaseColumnInfo[];
};

export type DatabaseSnapshot = {
  userVersion: number;
  tables: string[];
  details: DatabaseTableSnapshot[];
};

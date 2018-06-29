export interface SeasonTicket {
  _id: string;
  accessCode: string;
  slug: string;
  sector: string;
  row: string;
  seat: number;
  tribune: string;
  reservedUntil: string;
  reservationType: string;
  status: string;
}

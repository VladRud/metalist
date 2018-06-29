import {Ticket} from './ticket.interface';
import {SeasonTicket} from './season-ticket.interface';

export interface Order {
  tickets: Ticket[]
  seasonTickets: SeasonTicket[]
}

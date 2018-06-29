import {Component, Input, Output, EventEmitter} from '@angular/core';
import {AuthService} from '../../../services/auth.service';


@Component({
  selector: 'abonement-ticket-list',
  templateUrl: './abonement-ticket-list.component.html',
  styleUrls: ['./abonement-ticket-list.component.css']
})
export class AbonementTicketListComponent {
  @Input() seasonTickets;
  @Output() deleteTicket = new EventEmitter<any>();
  @Output() printTicket = new EventEmitter<any>();

  constructor(private authService: AuthService) {
  }

  get isCashier(): boolean {
    return this.authService.isCashier();
  }

  public handleDelete(ticket): void {
    this.deleteTicket.emit(ticket);
  }

  public print(ticket): void {
    this.printTicket.emit(ticket);
  }
}

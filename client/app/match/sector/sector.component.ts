import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {uniqBy, remove} from 'lodash';
import {TranslateService} from '@ngx-translate/core';

import {PriceSchemaService} from '../../services/price-schema.service';
import {CartService} from '../../services/cart.service';
import {MatchService} from '../../services/match.service';
import {AppConstant} from '../../app.constant';
import {TicketService} from '../../services/ticket.service';
import {Sector} from '../../model/sector.interface';
import {Seat} from '../../model/seat.interface';
import {PriceSchema} from '../../model/price-schema.interface';
import {Match} from '../../model/match.interface';
import {AuthService} from '../../services/auth.service';
import {PrintTicketService} from '../../services/print-ticket.service';
import {fromEvent} from 'rxjs/observable/fromEvent';

@Component({
  selector: 'app-sector',
  templateUrl: './sector.component.html',
  styleUrls: ['./sector.component.less']
})

export class SectorComponent implements OnInit {

  match: Match;
  sector: Sector;
  reservedSeats: Seat[] = [];
  optimisticSeats = [];
  priceSchema: PriceSchema | {} = {};
  sectorPrice: string;
  message: string;
  matchId: string;
  sectorId: string;
  tribuneName: string;
  processedSeat: string;
  isMobile: boolean;
  tribune: string;
  sectorRows: Array<{ name: string; seats: string; seatMap: number[] }>;
  priceTypes = [
    {value: 'default', label: 'match.priceTypeOriginal', freeMessageStatus: null},
    {value: 'invitation', label: 'match.priceTypeInvitation', freeMessageStatus: 'invitation'},
    {value: 'zero', label: '0 грн.', freeMessageStatus: 'zero'},
    {value: 'custom', label: 'match.customPrice', freeMessageStatus: 'custom'}
  ];
  currentPriceType = this.priceTypes[0];
  tribuneNames = {
    ru: {north: 'Cевер', south: 'Юг', west: 'Запад', east: 'Восток'},
    uk: {north: 'Північна', south: 'Південна', west: 'Західна', east: 'Східна'}
  };
  customPrice: number;

  constructor(private priceSchemaService: PriceSchemaService,
              private cartService: CartService,
              private route: ActivatedRoute,
              private matchService: MatchService,
              private ticketsService: TicketService,
              private authService: AuthService,
              private printTicketService: PrintTicketService,
              private translateService: TranslateService) {
    this.route.params.subscribe((params: any) => this.matchId = params.matchId);
    this.route.params.subscribe((params: any) => this.sectorId = params.sectorId);
    this.route.params.subscribe((params: any) => this.tribuneName = params.tribuneId);

  }

  ngOnInit() {
    this.getPrice();
    this.getReservedSeats();
    this.getSelectedSeats();
    this.isMobile = window.innerWidth <= 1240;
    this.tribune = this.getTribune();
    fromEvent(window, 'resize').map((event: any) => {
      this.isMobile = event.target.innerWidth <= 1240;
    }).subscribe();
  }

  getPrice() {
    this.matchService.fetchMatch(this.matchId)
      .subscribe((res) => {
        this.match = res;
        this.priceSchema = this.match.priceSchema.priceSchema;

        if (this.match.priceSchema.priceSchema.stadiumName === 'dinamo') {
          this.sector = AppConstant.StadiumDinamo['tribune_' + this.tribuneName]['sector_' + this.sectorId];
        } else {
          if (this.match.priceSchema.priceSchema.stadiumName === 'solar') {
            this.sector = AppConstant.StadiumSolar['tribune_' + this.tribuneName]['sector_' + this.sectorId];
          } else {
            this.sector = AppConstant.StadiumMetalist['tribune_' + this.tribuneName]['sector_' + this.sectorId];
          }
        }
        this.sector.rows.map((row) => {
          return row.seatMap = this.makeArrayFromNumber(row.seats);
        });
        this.sectorRows = this.sector.rows.sort((a, b) => {
          return (+b.name) - (+a.name);
        });
        this.sectorPrice = this.priceSchemaService.getPriceBySector(this.tribuneName, this.sector.name, this.priceSchema);
      });
  }

  getReservedSeats() {
    const matchId = this.matchId,
      sectorName = this.sectorId;

    return this.ticketsService.fetchReservedSeats(matchId, sectorName)
      .subscribe(seats => {
        this.reservedSeats = seats;
        this.processedSeat = null;
      });
  }

  getSelectedSeats = () =>
    this.cartService.getCart()
      .subscribe(
        cart => this.optimisticSeats = cart.seats,
        err => console.log(err)
      );

  isSeatOptimistic = (slug, matchId) => {
    // check if seat is optimistic by slug and match id
    return this.optimisticSeats
      .find(({slug: seatSlug, match}) =>
        matchId && match && seatSlug === slug && match.id === matchId
      );
  };

  isSeatReserved = (slug) => this.reservedSeats.includes(slug);

  getSeatStatus(slug) {
    if (this.isSeatOptimistic(slug, this.match.id)) {
      return 'blockedSeat';
    }
    if (this.isSeatReserved(slug) && slug !== this.processedSeat) {
      return 'soldSeat';
    }
    return 'availableSeat';
  }

  toggleSeat(data) {
    const {sector, row, seat} = data;
    const slug = `s${sector}r${row}st${seat}`;
    if (this.getSeatStatus(slug) === 'soldSeat') {
      return;
    }
    // if match id is not passed sector match id is taken
    const matchId = data.matchId || this.match.id;
    this.message = '';
    const isSeatOptimistic = this.isSeatOptimistic(slug, matchId);
    // if seat exists in optimisticSeats than remove it, othervise add it
    if (isSeatOptimistic) {
      this.removeSeat(slug, seat, row, sector, matchId);
    } else {
      this.addSeat(slug, seat, row, sector, matchId);
    }
  }

  handleDelete(data) {
    // if match id is not given sector match id is taken
    const matchId = data.matchId || this.match.id;
    this.removeSeat(data.slug, data.sector, data.row, data.seat, matchId);
  }

  removeSeat = (slug, seat, row, sector, matchId) => {
    this.toggleOptimisticSeats(slug, seat, row, sector, matchId, false);
    return this.cartService.removeSeatFromCart(slug, matchId)
      .subscribe(
        () => this.getReservedSeats(),
        error => {
          this.getReservedSeats();
          this.toggleOptimisticSeats(slug, seat, row, sector, matchId, true);
        }
      );
  };

  addSeat = (slug, seat, row, sector, matchId) => {
    this.toggleOptimisticSeats(slug, seat, row, sector, matchId, true);
    return this.cartService.addSeatToCart(
      slug,
      matchId,
      {
        seat,
        row,
        sector,
        tribune: this.tribuneName
      })
      .subscribe(
        () => this.getReservedSeats(),
        error => {
          if (error.status === 409) {
            this.message = 'Это место уже занято.';
            this.getReservedSeats();
          }
          this.toggleOptimisticSeats(slug, seat, row, sector, matchId, false);
        }
      );
  };

  toggleOptimisticSeats(slug, seat, row, sector, matchId, show) {
    this.processedSeat = slug;
    if (show) {
      this.optimisticSeats.push({slug, seat, row, sector, match: this.match, price: this.sectorPrice});
    } else {
      this.optimisticSeats = this.optimisticSeats
        .filter(({slug: seatSlug, match: {_id: seatMatchId}}) => !(seatSlug === slug && seatMatchId === matchId));
    }
  }

  public makeArrayFromNumber(seats): any[] {
    const resultArray = [];
    if (seats.includes(',') || seats.includes('-')) {
      seats.split(',').map((interval) => {
        const intervalBoundaries = interval.split('-');
        const start = intervalBoundaries[0];
        const end = intervalBoundaries[1];
        resultArray.push(...Array(end - start + 1).fill(0).map((_, id) => +start + +id));
      });
    } else {
      resultArray.push(...Array.from(Array(+seats).keys()).map(x => x + 1));
    }
    return resultArray;
  }

  isSkybox() {
    const skyBoxes: any = ['SB_1', 'SB_2', 'SB_3_5', 'SB_6', 'SB_7', 'SB_8', 'SB_9', 'SB_10', 'SB_11'];
    return this.sector ? skyBoxes.includes(this.sector.name) : false;
  }

  get isCashier() {
    return this.authService.isCashier();
  }

  pay() {
    if (!this.optimisticSeats.length) {
      return;
    }
    this.cartService.pay(this.currentPriceType.freeMessageStatus, this.customPrice)
      .subscribe(
        order => {
          let data = [];
          order.seasonTickets.length ?
            data = order.seasonTickets.map(ticket => {
              return ({...ticket});
            }) :
            data = order.tickets.map(ticket => {
              return ({...ticket, ...ticket.seat, customPrice: this.customPrice});
            });
          this.printTicketService.print(data, this.currentPriceType.freeMessageStatus);
          this.getReservedSeats();
          this.getSelectedSeats();
        },
        err => console.log(err)
      );
  }

  getTribune() {
    let language = this.translateService.getBrowserLang();
    language = ['ru', 'uk'].includes(language) ? language : 'uk';
    return this.tribuneNames[language][this.tribuneName];
  }


  get firstUpperRow() {
    const sectorDividers: any = {
      '1': 19,
      '2': 20,
      '8': 20,
      '9': 19,
      '10': 15,
      '11': 15,
      '12': 15,
      '13': 15,
      '14': 15,
      '15': 15,
      '16': 15,
      '17': 15,
      '18': 15,
      '19': 15,
      '20': 15,
      '22': 9,
      '23': 9,
      '24': 9,
      '25': 9,
      '26': 9,
      '27': 9,
      '28': 9,
      '29': 9,
    };
    return sectorDividers[this.sector.name] || 1;
  }
}

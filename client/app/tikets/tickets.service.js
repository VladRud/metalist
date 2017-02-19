(function () {
  'use strict';

  class TicketsService {

    constructor($http) {
      this.$http = $http;
    }

     fetchReservedTickets(matchId, sectorName) {
     return this.$http.get('api/tickets/reserved-on-match/' + matchId +'/sector/' + sectorName)
     .then(response => response.data);
     }
  }
  angular.module('metalistTicketsApp')
    .service('TicketsService', TicketsService);
})();

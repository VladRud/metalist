'use strict';

import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import { Schema } from 'mongoose';
import { Ticket } from '../ticket/ticket.model';
import { Seat } from '../seat/seat.model';


let OrderSchema = new Schema({
  publicId: {
    type: String,
    required: true
  },
  privateId: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: [ 'new', 'pending', 'paid', 'failed' ],
    required: true,
    default: 'new',
  },
  type: {
    type: String,
    enum: [ 'order', 'cart' ],
    required: true,
    default: 'cart',
  },
  paymentDetails: Schema.Types.Mixed,
  tickets: [ {type: Schema.Types.ObjectId, ref: 'Ticket'} ],
  seasonTickets: [ {type: Schema.Types.ObjectId, ref: 'SeasonTicket'} ],
  seats: [ {type: Schema.Types.ObjectId, ref: 'Seat'} ],
  user: {
    id: String,
    email: String,
    name: String,
  },
  created: {
    type: Date,
    default: Date.now
  },
  freeMessageStatus: {
    type: String,
    default: null
  },
  customPrice: {
    type: String,
    default: null
  }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  usePushEach: true,
});

OrderSchema
  .virtual('size')
  .get(function() {
    return this.seats.length;
  });

export default mongoose.model('Order', OrderSchema);


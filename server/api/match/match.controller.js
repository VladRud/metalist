'use strict';

import Match from './../models/match.model';
import Seat from './../models/seat.model';
import * as _ from 'lodash';
import * as config from "../../config/environment"

function respondWithResult(res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            return res.status(statusCode).json(entity);
        }
    };
}

function handleError(res, statusCode) {
    statusCode = statusCode || 500;
    return function (err) {
        console.log(err);
        res.status(statusCode).send(err);
    };
}

export function index(req, res) {
    return Match.find({
        $or: [
            {date: { $gt: Date.now() }},
            {date: null}
        ],
    }).sort({round: 1}).exec()
        // .then(matches => {
        //     var result = _.map(matches, (match) => {
        //
        //         return match;
        //
        //         // return {
        //         //     '_id': match.id,
        //         // };
        //     });
        //
        //     return res.status(200).json(result);
        // })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

export function view(req, res) {
    return Match.findById(req.params.id).exec()
        // .then(matches => {
        //     var result = _.map(matches, (match) => {
        //
        //         return match;
        //
        //         // return {
        //         //     '_id': match.id,
        //         // };
        //     });
        //
        //     return res.status(200).json(result);
        // })
        .then(respondWithResult(res))
        .catch(handleError(res));
}

export function seats(req, res) {
    // return res.status(400).json({});
    return Seat.find().exec()
        // .then(matches => {
        //     var result = _.map(matches, (match) => {
        //
        //         return match;
        //
        //         // return {
        //         //     '_id': match.id,
        //         // };
        //     });
        //
        //     return res.status(200).json(result);
        // })
        // .then((result) => {
        //     console.log(result);
        //     // console.log(result[0].price);
        //     // console.log(result[0].formattedPrice);
        //
        //     return result;
        // })
        .then(respondWithResult(res))
        .catch(handleError(res));
}


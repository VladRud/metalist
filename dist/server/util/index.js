"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var formatMoney = exports.formatMoney = function formatMoney(raw) {
    return (raw / 100).toFixed(2);
};
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generatePassByMail = generatePassByMail;
var PasswordGenerator = require('strict-password-generator').default;
var passwordGenerator = new PasswordGenerator();

var options = {
  upperCaseAlpha: true,
  lowerCaseAlpha: true,
  number: true,
  specialCharacter: false,
  minimumLength: 8,
  maximumLength: 10
};

function generatePassByMail() {
  return passwordGenerator.generatePassword(options);
}
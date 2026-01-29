const otplib = require('otplib');
console.log(Object.keys(otplib));
if (otplib.default) console.log('default:', Object.keys(otplib.default));

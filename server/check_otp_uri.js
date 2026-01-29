const otplib = require('otplib');
const { TOTP } = otplib;
const totp = new TOTP();
try {
    console.log('toURI args:', totp.toURI('secret', 'user', 'issuer'));
} catch (e) {
    console.log('toURI failed with args, trying object');
    try {
        console.log('toURI object:', totp.toURI({ secret: 'secret', accountName: 'user', issuer: 'issuer' }));
    } catch (e2) {
        console.log('toURI object failed too');
    }
}

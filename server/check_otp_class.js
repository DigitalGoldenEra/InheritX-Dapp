const otplib = require('otplib');
const { TOTP } = otplib;
if (TOTP) {
    const totp = new TOTP();
    console.log('TOTP methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(totp)));
} else {
    console.log('TOTP class not found in exports');
}

const { TOTP, NobleCryptoPlugin, ScureBase32Plugin } = require('otplib');

try {
    const authenticator = new TOTP({
        crypto: new NobleCryptoPlugin(),
        base32: new ScureBase32Plugin(),
        step: 30,
        window: 1,
    });

    console.log('Authenticator methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(authenticator)));

    if (authenticator.keyuri) {
        console.log('keyuri exists');
    } else {
        console.log('keyuri DOES NOT exist');
    }

    if (authenticator.check) {
        console.log('check exists');
    }
} catch (error) {
    console.error('Error:', error);
}

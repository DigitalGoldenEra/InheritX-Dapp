const ethers = require('ethers');

const candidates = [
"AccessControlUnauthorizedAccount(address,bytes32)",
"OwnableUnauthorizedAccount(address)",
"KYCAlreadyApproved()",
"KYCAlreadyApproved(address)",
"AlreadyApproved()",
"NotAdmin()",
"OnlyAdmin()",
"InvalidSignature()",
"SignatureExpired()",
"NonceUsed()",
"CallException()",
"ExecutionReverted()"
];

candidates.forEach(sig => {
    const hash = ethers.id(sig).slice(0, 10);
    if (hash === '0x342569d8') {
        console.log(`MATCH FOUND: ${sig} -> ${hash}`);
    } else {
        // console.log(`${sig} -> ${hash}`);
    }
});

const fs = require('fs');
const ethers = require('ethers');

// Read the file content
const fileContent = fs.readFileSync('../../client/src/contract/abi.ts', 'utf8');

// Extract the array content. It starts after 'const inheritXABI = [' and ends before '];'
const start = fileContent.indexOf('[');
const end = fileContent.lastIndexOf(']');
const jsonString = fileContent.slice(start, end + 1);

// We need to validify the JSON because the file probably has single quotes or trailing commas
// A simple way is to use eval since it's a JS file content
// Or just regex out the errors.
// Let's use a simple regex regex to find errors definitions
// { inputs: [], name: 'AccessControlBadConfirmation', type: 'error' },
// { inputs: [...], name: 'AccessControlUnauthorizedAccount', type: 'error' },

const errorRegex = /name:\s*'([^']+)',\s*type:\s*'error'/g;
// Verify full definition needs inputs too.

// Let's rely on ethers Interface with the whole ABI if possible.
// We can use eval to get the object since it is JS.
const abi = eval(jsonString);

const iface = new ethers.Interface(abi);

console.log("Searching for 0x342569d8...");

abi.forEach(item => {
    if (item.type === 'error') {
        try {
            // Reconstruct the signature
            // ethers Interface can do this automatically given the ABI object
            const fragment = ethers.ErrorFragment.from(item);
            const id = iface.getError(fragment.name).selector;
            
            console.log(`${fragment.name}: ${id}`);
            
            if (id === '0x342569d8') {
                console.log(`!!! MATCH FOUND !!!: ${fragment.name}`);
            }
        } catch (e) {
            console.log('Error processing ' + item.name + ': ' + e.message);
        }
    }
});


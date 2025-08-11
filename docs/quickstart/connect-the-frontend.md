# Connect the Frontend

In this section of the Sign-In with Ethereum quickstart guide, you'll learn how to update the frontend to send signed messages to the server.

## Prerequisites
- A completed backend from the previous steps
- Basic understanding of JavaScript and web development

## Step-by-Step Implementation

### 1. Update `src/index.js`

```javascript
import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

const domain = window.location.host;
const origin = window.location.origin;
const provider = new BrowserProvider(window.ethereum);

const BACKEND_ADDR = "http://localhost:3000";

async function createSiweMessage(address, statement) {
    const res = await fetch(`${BACKEND_ADDR}/nonce`);
    const message = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: '1',
        nonce: await res.text()
    });
    return message.prepareMessage();
}

function connectWallet() {
    provider.send('eth_requestAccounts', [])
        .catch(() => console.log('user rejected request'));
}

let message = null;
let signature = null;

async function signInWithEthereum() {
    const signer = await provider.getSigner();

    message = await createSiweMessage(
        await signer.address,
        'Sign in with Ethereum to the app.'
    );
    console.log(message);
    signature = await signer.signMessage(message);
    console.log(signature);
}

async function sendForVerification() {
    const res = await fetch(`${BACKEND_ADDR}/verify`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
    });
    console.log(await res.text());
}

const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
```

### 2. Wire Up Event Listeners

Connect the buttons to their respective functions:

```javascript
connectWalletBtn.addEventListener('click', connectWallet);
siweBtn.addEventListener('click', signInWithEthereum);
```

## Key Points

- The frontend creates SIWE messages with proper domain and origin
- Users sign the message with their connected wallet
- Signed messages are sent to the backend for verification
- Proper error handling ensures a smooth user experience

## Next Steps

Continue to the next section to learn about implementing sessions for enhanced security.
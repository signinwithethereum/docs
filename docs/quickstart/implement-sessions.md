# Implement Sessions

This guide demonstrates how to implement sessions with Express.js to add backend security for Sign in with Ethereum (SIWE).

## Prerequisites

-   A SIWE backend project
-   Express.js
-   Basic understanding of session management

## Implementation Steps

### 1. Install Dependencies

```bash
yarn add express-session
```

### 2. Update Backend Configuration

Modify `src/index.js` to include session management:

```javascript
import cors from 'cors'
import express from 'express'
import Session from 'express-session'
import { generateNonce, SiweMessage } from 'siwe'

const app = express()
app.use(express.json())
app.use(
	cors({
		origin: 'http://localhost:8080',
		credentials: true,
	})
)

app.use(
	Session({
		name: 'siwe-quickstart',
		secret: 'siwe-quickstart-secret',
		resave: true,
		saveUninitialized: true,
		cookie: { secure: false, sameSite: true },
	})
)

app.get('/nonce', async function (req, res) {
	req.session.nonce = generateNonce()
	res.setHeader('Content-Type', 'text/plain')
	res.status(200).send(req.session.nonce)
})

app.post('/verify', async function (req, res) {
	try {
		if (!req.body.message) {
			res.status(422).json({
				message: 'Expected prepareMessage object as body.',
			})
			return
		}

		let SIWEObject = new SiweMessage(req.body.message)
		const { data: message } = await SIWEObject.verify({
			signature: req.body.signature,
			nonce: req.session.nonce,
		})

		req.session.siwe = message
		req.session.cookie.expires = new Date(message.expirationTime)
		req.session.save(() => res.status(200).send(true))
	} catch (e) {
		req.session.siwe = null
		req.session.nonce = null
		console.error(e)
		res.status(400).send(`Failed to verify message: ${e.message}`)
	}
})

app.get('/personal_information', function (req, res) {
	if (!req.session.siwe) {
		res.status(401).json({ message: 'You have to first sign_in' })
		return
	}
	console.log('User is authenticated!')
	res.setHeader('Content-Type', 'text/plain')
	res.send(
		`You are authenticated and your address is: ${req.session.siwe.address}`
	)
})

app.listen(3000, () => {
	console.log(`Example app listening on port 3000`)
})
```

## Key Features

-   **Session Management**: Uses `express-session` to maintain user state
-   **Secure Cookies**: Configures cookie settings for security
-   **Authentication Middleware**: Protects routes that require authentication
-   **Session Persistence**: Maintains user login state across requests

## Security Considerations

-   Use a strong, unique session secret in production
-   Enable `secure: true` for HTTPS environments
-   Consider using a session store (like Redis) for production applications
-   Implement proper session cleanup and expiration

## Next Steps

Continue to learn about resolving ENS profiles to enhance user experience.

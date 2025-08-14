# Frontend Setup

In this tutorial, you'll build a React frontend that connects to user wallets and requests SIWE message signatures. You'll learn how to detect wallet connections, handle user addresses, and request message signatures using ethers.js.

## Learning Objectives

By the end of this tutorial, you'll understand:

-   How to connect to MetaMask and other Ethereum wallets
-   How to detect user address changes and network switches
-   How to request message signatures from connected wallets
-   Best practices for wallet integration and user experience

## Project Setup

Let's create a React application with the necessary dependencies:

```bash
# Create a new React app
npx create-react-app siwe-frontend
cd siwe-frontend

# Install Web3 dependencies
npm install siwe ethers

# Install additional UI dependencies (optional)
npm install styled-components

# Start the development server
npm start
```

## Wallet Connection Component

Create a new file `src/components/WalletConnect.js`:

```javascript
import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const WalletConnect = () => {
	const [isConnected, setIsConnected] = useState(false)
	const [userAddress, setUserAddress] = useState('')
	const [chainId, setChainId] = useState(null)
	const [provider, setProvider] = useState(null)
	const [signer, setSigner] = useState(null)

	// Check if wallet is already connected on component mount
	useEffect(() => {
		checkWalletConnection()
		setupEventListeners()
	}, [])

	const checkWalletConnection = async () => {
		if (typeof window.ethereum !== 'undefined') {
			try {
				const provider = new ethers.providers.Web3Provider(
					window.ethereum
				)
				const accounts = await provider.listAccounts()

				if (accounts.length > 0) {
					const signer = provider.getSigner()
					const address = await signer.getAddress()
					const network = await provider.getNetwork()

					setProvider(provider)
					setSigner(signer)
					setUserAddress(address)
					setChainId(network.chainId)
					setIsConnected(true)
				}
			} catch (error) {
				console.error('Error checking wallet connection:', error)
			}
		}
	}

	const setupEventListeners = () => {
		if (window.ethereum) {
			// Listen for account changes
			window.ethereum.on('accountsChanged', handleAccountsChanged)

			// Listen for chain changes
			window.ethereum.on('chainChanged', handleChainChanged)

			// Listen for connection changes
			window.ethereum.on('connect', handleConnect)
			window.ethereum.on('disconnect', handleDisconnect)
		}
	}

	const handleAccountsChanged = accounts => {
		if (accounts.length === 0) {
			// User disconnected
			disconnect()
		} else {
			// User switched accounts
			setUserAddress(accounts[0])
		}
	}

	const handleChainChanged = chainId => {
		// Convert hex to decimal
		const decimalChainId = parseInt(chainId, 16)
		setChainId(decimalChainId)

		// Reload the page to reset the dapp state
		window.location.reload()
	}

	const handleConnect = connectInfo => {
		console.log('Wallet connected:', connectInfo)
		checkWalletConnection()
	}

	const handleDisconnect = error => {
		console.log('Wallet disconnected:', error)
		disconnect()
	}

	const connectWallet = async () => {
		if (typeof window.ethereum === 'undefined') {
			alert('MetaMask is not installed! Please install MetaMask.')
			return
		}

		try {
			// Request account access
			await window.ethereum.request({ method: 'eth_requestAccounts' })

			// Create provider and signer
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const signer = provider.getSigner()
			const address = await signer.getAddress()
			const network = await provider.getNetwork()

			setProvider(provider)
			setSigner(signer)
			setUserAddress(address)
			setChainId(network.chainId)
			setIsConnected(true)

			console.log('Connected to wallet:', {
				address,
				chainId: network.chainId,
				networkName: network.name,
			})
		} catch (error) {
			console.error('Error connecting wallet:', error)

			// Handle specific error cases
			if (error.code === 4001) {
				alert('Please connect to MetaMask.')
			} else {
				alert('An error occurred while connecting to the wallet.')
			}
		}
	}

	const disconnect = () => {
		setIsConnected(false)
		setUserAddress('')
		setChainId(null)
		setProvider(null)
		setSigner(null)
	}

	const formatAddress = address => {
		if (!address) return ''
		return `${address.substring(0, 6)}...${address.substring(
			address.length - 4
		)}`
	}

	const getNetworkName = chainId => {
		const networks = {
			1: 'Ethereum Mainnet',
			5: 'Goerli Testnet',
			137: 'Polygon Mainnet',
			80001: 'Polygon Mumbai',
		}
		return networks[chainId] || `Network ${chainId}`
	}

	return (
		<div
			style={{
				padding: '20px',
				border: '1px solid #ccc',
				borderRadius: '8px',
				margin: '20px',
			}}
		>
			<h2>Wallet Connection</h2>

			{!isConnected ? (
				<div>
					<p>Connect your wallet to get started</p>
					<button
						onClick={connectWallet}
						style={{
							padding: '10px 20px',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Connect Wallet
					</button>
				</div>
			) : (
				<div>
					<p>
						<strong>Status:</strong> Connected ✅
					</p>
					<p>
						<strong>Address:</strong> {formatAddress(userAddress)}
					</p>
					<p>
						<strong>Full Address:</strong>{' '}
						<code>{userAddress}</code>
					</p>
					<p>
						<strong>Network:</strong> {getNetworkName(chainId)}
					</p>
					<button
						onClick={disconnect}
						style={{
							padding: '10px 20px',
							backgroundColor: '#dc3545',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Disconnect
					</button>
				</div>
			)}
		</div>
	)
}

export default WalletConnect
```

## SIWE Message Signing Component

Create `src/components/SiweAuth.js`:

```javascript
import React, { useState } from 'react'
import { SiweMessage } from 'siwe'
import { ethers } from 'ethers'

const SiweAuth = ({ userAddress, signer, chainId }) => {
	const [message, setMessage] = useState('')
	const [signature, setSignature] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const createSiweMessage = () => {
		if (!userAddress) {
			setError('No wallet connected')
			return
		}

		try {
			const siweMessage = new SiweMessage({
				domain: window.location.host,
				address: userAddress,
				statement:
					'Welcome to our Web3 app! Sign this message to authenticate securely.',
				uri: window.location.origin,
				version: '1',
				chainId: chainId || 1,
				nonce: Math.random().toString(36).substring(2, 15), // Simple nonce for demo
				issuedAt: new Date().toISOString(),
				expirationTime: new Date(
					Date.now() + 10 * 60 * 1000
				).toISOString(), // 10 minutes
			})

			const formattedMessage = siweMessage.prepareMessage()
			setMessage(formattedMessage)
			setError('')

			console.log('Created SIWE message:', formattedMessage)
		} catch (error) {
			console.error('Error creating SIWE message:', error)
			setError('Failed to create message: ' + error.message)
		}
	}

	const signMessage = async () => {
		if (!message) {
			setError('No message to sign')
			return
		}

		if (!signer) {
			setError('No signer available')
			return
		}

		setIsLoading(true)
		setError('')

		try {
			console.log('Requesting signature for message:', message)

			// Request signature from wallet
			const signature = await signer.signMessage(message)

			console.log('Signature received:', signature)
			setSignature(signature)
		} catch (error) {
			console.error('Error signing message:', error)

			// Handle user rejection
			if (error.code === 4001) {
				setError('User rejected the signature request')
			} else if (error.code === -32603) {
				setError('Internal wallet error. Please try again.')
			} else {
				setError('Failed to sign message: ' + error.message)
			}
		} finally {
			setIsLoading(false)
		}
	}

	const verifySignature = async () => {
		if (!message || !signature) {
			setError('Message and signature required for verification')
			return
		}

		try {
			// Parse the message back to SiweMessage object
			const siweMessage = new SiweMessage(message)

			// Verify the signature
			const verification = await siweMessage.verify({ signature })

			if (verification.success) {
				console.log(
					'✅ Signature verification successful!',
					verification
				)
				alert('Signature verified successfully!')
			} else {
				console.log('❌ Signature verification failed:', verification)
				setError('Signature verification failed')
			}
		} catch (error) {
			console.error('Error verifying signature:', error)
			setError('Verification failed: ' + error.message)
		}
	}

	const resetDemo = () => {
		setMessage('')
		setSignature('')
		setError('')
	}

	return (
		<div
			style={{
				padding: '20px',
				border: '1px solid #ccc',
				borderRadius: '8px',
				margin: '20px',
			}}
		>
			<h2>SIWE Authentication</h2>

			{!userAddress && (
				<p style={{ color: '#666' }}>
					Please connect your wallet first to use SIWE authentication.
				</p>
			)}

			{userAddress && (
				<>
					<div style={{ marginBottom: '20px' }}>
						<button
							onClick={createSiweMessage}
							disabled={isLoading}
							style={{
								padding: '10px 20px',
								backgroundColor: '#28a745',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								marginRight: '10px',
							}}
						>
							Create SIWE Message
						</button>

						<button
							onClick={signMessage}
							disabled={!message || isLoading}
							style={{
								padding: '10px 20px',
								backgroundColor: '#007bff',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: message ? 'pointer' : 'not-allowed',
								opacity: message ? 1 : 0.6,
								marginRight: '10px',
							}}
						>
							{isLoading ? 'Signing...' : 'Sign Message'}
						</button>

						<button
							onClick={verifySignature}
							disabled={!signature || isLoading}
							style={{
								padding: '10px 20px',
								backgroundColor: '#17a2b8',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: signature ? 'pointer' : 'not-allowed',
								opacity: signature ? 1 : 0.6,
								marginRight: '10px',
							}}
						>
							Verify Signature
						</button>

						<button
							onClick={resetDemo}
							style={{
								padding: '10px 20px',
								backgroundColor: '#6c757d',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Reset
						</button>
					</div>

					{error && (
						<div
							style={{
								color: '#dc3545',
								backgroundColor: '#f8d7da',
								padding: '10px',
								borderRadius: '4px',
								marginBottom: '20px',
							}}
						>
							<strong>Error:</strong> {error}
						</div>
					)}

					{message && (
						<div style={{ marginBottom: '20px' }}>
							<h3>Generated Message:</h3>
							<pre
								style={{
									backgroundColor: '#f8f9fa',
									padding: '15px',
									borderRadius: '4px',
									overflow: 'auto',
									fontSize: '12px',
									border: '1px solid #dee2e6',
								}}
							>
								{message}
							</pre>
						</div>
					)}

					{signature && (
						<div style={{ marginBottom: '20px' }}>
							<h3>Generated Signature:</h3>
							<div
								style={{
									backgroundColor: '#f8f9fa',
									padding: '15px',
									borderRadius: '4px',
									wordBreak: 'break-all',
									fontSize: '12px',
									border: '1px solid #dee2e6',
								}}
							>
								{signature}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default SiweAuth
```

## Main App Component

Update `src/App.js` to use our components:

```javascript
import React, { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import SiweAuth from './components/SiweAuth'
import './App.css'

function App() {
	const [walletInfo, setWalletInfo] = useState({
		isConnected: false,
		userAddress: '',
		chainId: null,
		provider: null,
		signer: null,
	})

	const handleWalletConnection = connectionInfo => {
		setWalletInfo(connectionInfo)
	}

	return (
		<div className='App'>
			<header
				style={{
					backgroundColor: '#282c34',
					padding: '20px',
					color: 'white',
					textAlign: 'center',
				}}
			>
				<h1>Sign in with Ethereum Demo</h1>
				<p>A complete tutorial on Web3 authentication</p>
			</header>

			<main
				style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}
			>
				<WalletConnect onConnectionChange={handleWalletConnection} />

				<SiweAuth
					userAddress={walletInfo.userAddress}
					signer={walletInfo.signer}
					chainId={walletInfo.chainId}
				/>

				<div
					style={{
						marginTop: '40px',
						padding: '20px',
						backgroundColor: '#f8f9fa',
						borderRadius: '8px',
					}}
				>
					<h3>How it works:</h3>
					<ol>
						<li>
							<strong>Connect Wallet:</strong> Click "Connect
							Wallet" to connect your MetaMask or compatible
							wallet
						</li>
						<li>
							<strong>Create Message:</strong> Generate a SIWE
							message with your address and current timestamp
						</li>
						<li>
							<strong>Sign Message:</strong> Use your wallet to
							cryptographically sign the authentication message
						</li>
						<li>
							<strong>Verify Signature:</strong> Validate that the
							signature matches the message and address
						</li>
					</ol>

					<div
						style={{
							marginTop: '20px',
							padding: '15px',
							backgroundColor: '#d1ecf1',
							borderRadius: '4px',
						}}
					>
						<strong>💡 Pro Tip:</strong> In a real application,
						message creation and signature verification would happen
						on your backend server for security. This demo shows the
						complete flow in the browser for educational purposes.
					</div>
				</div>
			</main>
		</div>
	)
}

export default App
```

## Enhanced Wallet Detection

Create `src/utils/walletUtils.js` for better wallet handling:

```javascript
// Detect available wallets
export const detectWallets = () => {
	const wallets = []

	// MetaMask
	if (window.ethereum?.isMetaMask) {
		wallets.push({
			name: 'MetaMask',
			icon: '🦊',
			provider: window.ethereum,
			type: 'metamask',
		})
	}

	// Coinbase Wallet
	if (window.ethereum?.isCoinbaseWallet) {
		wallets.push({
			name: 'Coinbase Wallet',
			icon: '🔵',
			provider: window.ethereum,
			type: 'coinbase',
		})
	}

	// WalletConnect (if injected)
	if (
		window.ethereum &&
		!window.ethereum.isMetaMask &&
		!window.ethereum.isCoinbaseWallet
	) {
		wallets.push({
			name: 'Injected Wallet',
			icon: '💼',
			provider: window.ethereum,
			type: 'injected',
		})
	}

	return wallets
}

// Format Ethereum address for display
export const formatAddress = (address, startLength = 6, endLength = 4) => {
	if (!address) return ''
	if (address.length < startLength + endLength) return address
	return `${address.substring(0, startLength)}...${address.substring(
		address.length - endLength
	)}`
}

// Get network information
export const getNetworkInfo = chainId => {
	const networks = {
		1: { name: 'Ethereum Mainnet', color: '#627eea' },
		5: { name: 'Goerli Testnet', color: '#f6c343' },
		137: { name: 'Polygon Mainnet', color: '#8247e5' },
		80001: { name: 'Polygon Mumbai', color: '#8247e5' },
		56: { name: 'BSC Mainnet', color: '#f0b90b' },
		97: { name: 'BSC Testnet', color: '#f0b90b' },
		43114: { name: 'Avalanche C-Chain', color: '#e84142' },
		250: { name: 'Fantom Opera', color: '#1969ff' },
		42161: { name: 'Arbitrum One', color: '#96bedc' },
		10: { name: 'Optimism', color: '#ff0420' },
	}

	return (
		networks[chainId] || {
			name: `Network ${chainId}`,
			color: '#666666',
		}
	)
}

// Validate Ethereum address
export const isValidAddress = address => {
	return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Switch network (for MetaMask)
export const switchNetwork = async chainId => {
	if (!window.ethereum) {
		throw new Error('No wallet found')
	}

	try {
		await window.ethereum.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: `0x${chainId.toString(16)}` }],
		})
	} catch (error) {
		// Network not added to wallet
		if (error.code === 4902) {
			throw new Error(`Network ${chainId} not added to wallet`)
		}
		throw error
	}
}
```

## Error Handling and User Experience

Create `src/components/ErrorBoundary.js`:

```javascript
import React from 'react'

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error }
	}

	componentDidCatch(error, errorInfo) {
		console.error('SIWE Error Boundary caught an error:', error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						padding: '40px',
						textAlign: 'center',
						border: '2px solid #dc3545',
						borderRadius: '8px',
						backgroundColor: '#f8d7da',
						color: '#721c24',
					}}
				>
					<h2>🚫 Something went wrong</h2>
					<p>
						An error occurred in the SIWE authentication component.
					</p>
					<details style={{ marginTop: '20px' }}>
						<summary>Error Details</summary>
						<pre style={{ textAlign: 'left', marginTop: '10px' }}>
							{this.state.error?.toString()}
						</pre>
					</details>
					<button
						onClick={() =>
							this.setState({ hasError: false, error: null })
						}
						style={{
							marginTop: '20px',
							padding: '10px 20px',
							backgroundColor: '#dc3545',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Try Again
					</button>
				</div>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary
```

## Testing Your Frontend

1. **Start the development server:**

```bash
npm start
```

2. **Test wallet connection:**

    - Click "Connect Wallet"
    - Approve the connection in MetaMask
    - Verify address and network display correctly

3. **Test message creation:**

    - Click "Create SIWE Message"
    - Review the generated message format
    - Verify all required fields are present

4. **Test message signing:**

    - Click "Sign Message"
    - Approve the signature in MetaMask
    - Verify signature is generated

5. **Test signature verification:**
    - Click "Verify Signature"
    - Confirm verification succeeds



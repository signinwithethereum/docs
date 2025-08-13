# Other Onchain Assets

This guide demonstrates how to pull information about a user's onchain holdings including NFTs, tokens, and other crypto assets.


## Implementation Steps

### 1. Update HTML

Modify `index.html` to include sections for both NFT and asset holdings:

```html
<div class="hidden" id="holdings">
	<h3>Onchain Holdings</h3>
	
	<!-- Asset Holdings Section -->
	<div id="assets">
		<h4>Token Assets</h4>
		<div id="assetsLoader"></div>
		<div id="assetsContainer" class="hidden">
			<table id="assetsTable"></table>
		</div>
	</div>
	
	<!-- NFT Holdings Section -->
	<div id="nft">
		<h4>NFT Collection</h4>
		<div id="nftLoader"></div>
		<div id="nftContainer" class="hidden">
			<table id="nftTable"></table>
		</div>
	</div>
</div>
```

### 2. Update JavaScript (index.js)

Add functions to retrieve and display both asset and NFT holdings:

#### Asset Holdings Functions

```javascript
// Element references
const holdingsElm = document.getElementById('holdings')
const assetsLoaderElm = document.getElementById('assetsLoader')
const assetsTableElm = document.getElementById('assetsTable')
const nftElm = document.getElementById('nft')
const nftLoaderElm = document.getElementById('nftLoader')
const nftTableElm = document.getElementById('nftTable')

// Asset holdings functions
async function getTokenBalances() {
	try {
		// Using Moralis API for token balances
		const response = await fetch(
			`https://deep-index.moralis.io/api/v2/${address}/erc20`,
			{
				headers: {
					'X-API-Key': 'your-moralis-api-key',
					'accept': 'application/json'
				}
			}
		)
		
		if (!response.ok) {
			throw new Error(response.statusText)
		}
		
		const data = await response.json()
		
		return data
			.filter(token => parseFloat(token.balance) > 0)
			.map(token => ({
				name: token.name,
				symbol: token.symbol,
				balance: (parseFloat(token.balance) / Math.pow(10, token.decimals)).toFixed(4),
				address: token.token_address,
				decimals: token.decimals
			}))
	} catch (error) {
		console.error('Failed to fetch token balances:', error)
		return []
	}
}

async function getETHBalance() {
	try {
		const balance = await provider.getBalance(address)
		const ethBalance = ethers.utils.formatEther(balance)
		
		return {
			name: 'Ethereum',
			symbol: 'ETH',
			balance: parseFloat(ethBalance).toFixed(4),
			address: 'native',
			decimals: 18
		}
	} catch (error) {
		console.error('Failed to fetch ETH balance:', error)
		return null
	}
}

async function displayAssets() {
	assetsLoaderElm.innerHTML = 'Loading token assets...'
	
	try {
		const [ethBalance, tokenBalances] = await Promise.all([
			getETHBalance(),
			getTokenBalances()
		])
		
		const allAssets = ethBalance ? [ethBalance, ...tokenBalances] : tokenBalances
		
		if (allAssets.length === 0) {
			assetsLoaderElm.innerHTML = 'No token assets found'
			return
		}
		
		let tableHtml = '<tr><th>Token</th><th>Symbol</th><th>Balance</th><th>Contract</th></tr>'
		
		allAssets.forEach(asset => {
			tableHtml += `<tr>
				<td>${asset.name}</td>
				<td>${asset.symbol}</td>
				<td>${asset.balance}</td>
				<td>${asset.address === 'native' ? 'Native ETH' : asset.address}</td>
			</tr>`
		})
		
		assetsTableElm.innerHTML = tableHtml
		assetsLoaderElm.classList = 'hidden'
		document.getElementById('assetsContainer').classList = ''
	} catch (error) {
		console.error('Error displaying assets:', error)
		assetsLoaderElm.innerHTML = 'Error loading assets'
	}
}

// NFT holdings functions

async function getNFTs() {
	try {
		let res = await fetch(
			`https://api.opensea.io/api/v1/assets?owner=${address}`
		)
		if (!res.ok) {
			throw new Error(res.statusText)
		}

		let body = await res.json()

		if (
			!body.assets ||
			!Array.isArray(body.assets) ||
			body.assets.length === 0
		) {
			return []
		}

		return body.assets.map(asset => {
			let { name, asset_contract, token_id } = asset
			let { address } = asset_contract
			return { name, address, token_id }
		})
	} catch (err) {
		console.error(`Failed to resolve nfts: ${err.message}`)
		return []
	}
}

async function displayNFTs() {
	nftLoaderElm.innerHTML = 'Loading NFT Ownership...'
	nftElm.classList = ''

	let nfts = await getNFTs()
	if (nfts.length === 0) {
		nftLoaderElm.innerHTML = 'No NFTs found'
		return
	}

	let tableHtml =
		'<tr><th>Name</th><th>Contract Address</th><th>Token ID</th></tr>'

	nfts.forEach(nft => {
		tableHtml += `<tr>
            <td>${nft.name || 'Unnamed'}</td>
            <td>${nft.address}</td>
            <td>${nft.token_id}</td>
        </tr>`
	})

	nftTableElm.innerHTML = tableHtml
	nftLoaderElm.classList = 'hidden'
	document.getElementById('nftContainer').classList = ''
}
```

### 3. Call the Functions

Add both asset and NFT display functions to your authentication flow:

```javascript
// After successful authentication
async function onAuthenticated() {
	await displayENSProfile()
	await displayEFPProfile()
	await displayAssets()
	await displayNFTs()
	
	// Show the holdings section
	holdingsElm.classList = ''
}
```

## Alternative Asset APIs

### Using Alchemy for Token Balances

```javascript
async function getTokenBalancesAlchemy() {
	const apiKey = 'your-alchemy-api-key'
	const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
	
	try {
		const response = await fetch(`${baseURL}/getTokenBalances`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'alchemy_getTokenBalances',
				params: [address, 'erc20']
			})
		})
		
		const data = await response.json()
		
		return data.result.tokenBalances
			.filter(token => parseInt(token.tokenBalance, 16) > 0)
			.map(token => ({
				address: token.contractAddress,
				balance: parseInt(token.tokenBalance, 16)
			}))
	} catch (error) {
		console.error('Failed to fetch token balances from Alchemy:', error)
		return []
	}
}
```

### Using CoinGecko for Price Data

```javascript
async function getTokenPrices(tokenAddresses) {
	try {
		const addressList = tokenAddresses.join(',')
		const response = await fetch(
			`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressList}&vs_currencies=usd`
		)
		
		return await response.json()
	} catch (error) {
		console.error('Failed to fetch token prices:', error)
		return {}
	}
}
```

## Alternative NFT APIs

### Using Alchemy

```javascript
async function getNFTsAlchemy() {
	const apiKey = 'your-alchemy-api-key'
	const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}/getNFTs/`

	try {
		const response = await fetch(`${baseURL}?owner=${address}`)
		const data = await response.json()

		return data.ownedNfts.map(nft => ({
			name: nft.title,
			address: nft.contract.address,
			token_id: nft.id.tokenId,
		}))
	} catch (error) {
		console.error('Failed to fetch NFTs from Alchemy:', error)
		return []
	}
}
```

### Using Moralis

```javascript
async function getNFTsMoralis() {
	const apiKey = 'your-moralis-api-key'

	try {
		const response = await fetch(
			`https://deep-index.moralis.io/api/v2/${address}/nft`,
			{
				headers: {
					'X-API-Key': apiKey,
				},
			}
		)

		const data = await response.json()

		return data.result.map(nft => ({
			name: nft.name,
			address: nft.token_address,
			token_id: nft.token_id,
		}))
	} catch (error) {
		console.error('Failed to fetch NFTs from Moralis:', error)
		return []
	}
}
```

## Enhanced CSS Styling

Add styles for better presentation of holdings:

```css
.holdings-section {
	margin: 20px 0;
	padding: 15px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	background-color: #fafafa;
}

.holdings-section h4 {
	margin-top: 0;
	color: #333;
	border-bottom: 2px solid #007bff;
	padding-bottom: 8px;
}

.assets-table, .nft-table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 10px;
}

.assets-table th, .nft-table th {
	background-color: #007bff;
	color: white;
	padding: 12px;
	text-align: left;
}

.assets-table td, .nft-table td {
	padding: 10px;
	border-bottom: 1px solid #ddd;
}

.balance-cell {
	font-weight: bold;
	color: #28a745;
}

.contract-address {
	font-family: monospace;
	font-size: 0.9em;
	color: #666;
}
```

## Rate Limiting Considerations

-   Implement proper rate limiting for API calls
-   Consider caching both token and NFT data to reduce API requests
-   Handle API rate limit errors gracefully
-   Use batch requests when possible to minimize API calls
-   Implement exponential backoff for failed requests

## Privacy Considerations

-   All onchain holdings (tokens and NFTs) are public blockchain data
-   Consider allowing users to opt-out of holdings display
-   Be mindful of revealing sensitive information through asset ownership
-   Some users may prefer to keep their wealth information private
-   Consider implementing privacy toggles for different asset types

## Advanced Features

### Token-Gated Access Control

```javascript
async function checkTokenGatedAccess(requiredToken, minBalance) {
	const tokenBalances = await getTokenBalances()
	const tokenBalance = tokenBalances.find(token => 
		token.address.toLowerCase() === requiredToken.toLowerCase()
	)
	
	return tokenBalance && parseFloat(tokenBalance.balance) >= minBalance
}

async function checkNFTGatedAccess(requiredCollection) {
	const nfts = await getNFTs()
	return nfts.some(nft => 
		nft.address.toLowerCase() === requiredCollection.toLowerCase()
	)
}
```

### Portfolio Value Calculation

```javascript
async function calculatePortfolioValue() {
	const [tokenBalances, prices] = await Promise.all([
		getTokenBalances(),
		getTokenPrices(tokenBalances.map(t => t.address))
	])
	
	let totalValue = 0
	tokenBalances.forEach(token => {
		const price = prices[token.address.toLowerCase()]
		if (price && price.usd) {
			totalValue += parseFloat(token.balance) * price.usd
		}
	})
	
	return totalValue
}
```

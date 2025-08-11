# Resolve NFT Holdings

This guide demonstrates how to pull information about a user's NFT holdings using the Sign-In with Ethereum (SIWE) quickstart.

## Prerequisites

- Completed previous SIWE quickstart steps
- OpenSea API access (or alternative NFT API)
- Basic understanding of NFT standards

## Implementation Steps

### 1. Update HTML

Modify `index.html` to include a new table for NFT holdings:

```html
<div class="hidden" id="nft">
  <h3>NFT Ownership</h3>
  <div id="nftLoader"></div>
  <div id="nftContainer" class="hidden">
    <table id="nftTable">
    </table>
  </div>
</div>
```

### 2. Update JavaScript (index.js)

Add functions to retrieve and display NFT holdings:

```javascript
const nftElm = document.getElementById('nft');
const nftLoaderElm = document.getElementById('nftLoader');
const nftTableElm = document.getElementById('nftTable');

async function getNFTs() {
    try {
        let res = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}`);
        if (!res.ok) {
            throw new Error(res.statusText)
        }

        let body = await res.json();

        if (!body.assets || !Array.isArray(body.assets) || body.assets.length === 0) {
            return []
        }

        return body.assets.map((asset) => {
            let {name, asset_contract, token_id} = asset;
            let {address} = asset_contract;
            return {name, address, token_id};
        });
    } catch (err) {
        console.error(`Failed to resolve nfts: ${err.message}`);
        return [];
    }
}

async function displayNFTs() {
    nftLoaderElm.innerHTML = 'Loading NFT Ownership...';
    nftElm.classList = '';

    let nfts = await getNFTs();
    if (nfts.length === 0) {
        nftLoaderElm.innerHTML = 'No NFTs found';
        return;
    }

    let tableHtml = "<tr><th>Name</th><th>Contract Address</th><th>Token ID</th></tr>";
    
    nfts.forEach(nft => {
        tableHtml += `<tr>
            <td>${nft.name || 'Unnamed'}</td>
            <td>${nft.address}</td>
            <td>${nft.token_id}</td>
        </tr>`;
    });

    nftTableElm.innerHTML = tableHtml;
    nftLoaderElm.classList = 'hidden';
    document.getElementById('nftContainer').classList = '';
}
```

### 3. Call the Function

Add the NFT display function to your authentication flow:

```javascript
// After successful authentication
async function onAuthenticated() {
    await displayENSProfile();
    await displayNFTs();
}
```

## Alternative NFT APIs

### Using Alchemy

```javascript
async function getNFTsAlchemy() {
    const apiKey = 'your-alchemy-api-key';
    const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}/getNFTs/`;
    
    try {
        const response = await fetch(`${baseURL}?owner=${address}`);
        const data = await response.json();
        
        return data.ownedNfts.map(nft => ({
            name: nft.title,
            address: nft.contract.address,
            token_id: nft.id.tokenId
        }));
    } catch (error) {
        console.error('Failed to fetch NFTs from Alchemy:', error);
        return [];
    }
}
```

### Using Moralis

```javascript
async function getNFTsMoralis() {
    const apiKey = 'your-moralis-api-key';
    
    try {
        const response = await fetch(`https://deep-index.moralis.io/api/v2/${address}/nft`, {
            headers: {
                'X-API-Key': apiKey
            }
        });
        
        const data = await response.json();
        
        return data.result.map(nft => ({
            name: nft.name,
            address: nft.token_address,
            token_id: nft.token_id
        }));
    } catch (error) {
        console.error('Failed to fetch NFTs from Moralis:', error);
        return [];
    }
}
```

## Key Features

- **Multiple API Support**: Works with various NFT data providers
- **Error Handling**: Graceful handling of API failures and empty results
- **Responsive Display**: Clean table layout for NFT information
- **Loading States**: User-friendly loading indicators

## Rate Limiting Considerations

- Implement proper rate limiting for API calls
- Consider caching NFT data to reduce API requests
- Handle API rate limit errors gracefully

## Privacy Considerations

- NFT holdings are public on-chain data
- Consider allowing users to opt-out of NFT display
- Be mindful of revealing sensitive information through NFT ownership

## Next Steps

You've now completed the SIWE quickstart guide! You can enhance this further by:
- Adding more detailed NFT metadata (images, descriptions)
- Implementing NFT-based access control
- Creating custom authentication flows based on specific NFT ownership
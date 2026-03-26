# Migrating to SIWE TypeScript v4

## Overview

SIWE v4 (`@signinwithethereum/siwe`) is a major release that makes the library **provider-agnostic**, adds **EIP-6492 support**, and strengthens verification security by requiring `domain` and `nonce` in all `verify()` calls.

If you are using `siwe` v2.x, follow this guide to upgrade.

## Package Name Change

The package has been renamed:

```bash
# Old
npm install siwe ethers

# New
npm install @signinwithethereum/siwe
```

Update all imports:

```typescript
// Old
import { SiweMessage, generateNonce } from 'siwe'

// New
import { SiweMessage, generateNonce } from '@signinwithethereum/siwe'
```

## Breaking Changes

### 1. `nonce` and `issuedAt` are required in constructor

When constructing a `SiweMessage` from an object, `nonce` and `issuedAt` are now required fields (they are no longer auto-generated):

```typescript
// Old — nonce and issuedAt auto-generated
const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
})

// New — must provide nonce and issuedAt
const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
	nonce: generateNonce(),
	issuedAt: new Date().toISOString(),
})
```

### 2. `domain` and `nonce` are required in `verify()`

The `verify()` method now requires `domain` and `nonce` parameters for security (origin binding and replay resistance):

```typescript
// Old — domain and nonce optional
const result = await message.verify({ signature })

// New — domain and nonce required
const result = await message.verify({
	signature,
	domain: 'example.com',
	nonce: storedNonce,
})
```

### 3. `verify()` throws by default

In v2, `verify()` returned `{ success: false, error }` on failure. In v4, it **throws a `SiweError`** by default:

```typescript
// Old — check success boolean
const result = await message.verify({ signature })
if (result.success) {
	console.log(result.data)
} else {
	console.error(result.error)
}

// New — use try/catch (default behavior)
try {
	const result = await message.verify({
		signature,
		domain: 'example.com',
		nonce: storedNonce,
	})
	console.log(result.data)
} catch (error) {
	// error is SiweError with type, expected, received
	console.error(error.type)
}

// New — or suppress exceptions for v2-like behavior
const result = await message.verify(
	{ signature, domain: 'example.com', nonce: storedNonce },
	{ suppressExceptions: true },
)
if (!result.success) {
	console.error(result.error)
}
```

### 4. Provider-agnostic configuration

The library no longer depends on ethers.js. You must configure a verification backend:

```typescript
// Old — ethers auto-detected, provider passed to verify
import { ethers } from 'ethers'
const provider = new ethers.providers.JsonRpcProvider('https://...')
const result = await message.verify({ signature, provider })

// New — configure once at startup
import { configure, createConfig } from '@signinwithethereum/siwe'

configure(await createConfig('https://eth.llamarpc.com'))

// Then verify without passing provider
const result = await message.verify({
	signature,
	domain: 'example.com',
	nonce: storedNonce,
})
```

For explicit viem or ethers configuration, see the [Configuration](/libraries/typescript#configuration) section.

### 5. `validate()` removed

The `validate()` method from v1 has been fully removed. Use `verify()` instead.

### 6. `SiweError` extends `Error`

`SiweError` is now a proper `Error` subclass with stack traces and `instanceof` support:

```typescript
import { SiweError, SiweErrorType } from '@signinwithethereum/siwe'

try {
	await message.verify({ signature, domain, nonce })
} catch (error) {
	if (error instanceof SiweError) {
		switch (error.type) {
			case SiweErrorType.EXPIRED_MESSAGE:
				// handle expired
				break
			case SiweErrorType.INVALID_SIGNATURE:
				// handle invalid sig
				break
		}
	}
}
```

### 7. `SiweResponse.data` is `SiweMessage`

The `data` field in `SiweResponse` is now the `SiweMessage` instance itself, not a plain object:

```typescript
const result = await message.verify({ signature, domain, nonce })
// result.data is the SiweMessage instance
console.log(result.data.address) // same as message.address
```

## New Features

### EIP-6492 Support

Verify signatures from undeployed smart contract wallets automatically when using viem v2+ or ethers with a provider.

### Strict Mode

Require full contextual binding with `strict: true`:

```typescript
const result = await message.verify(
	{ signature, domain, nonce, uri: 'https://example.com', chainId: 1 },
	{ strict: true },
)
```

### Per-Call Configuration

Override the global config for specific chains or providers:

```typescript
const result = await message.verify(
	{ signature, domain, nonce },
	{ config: polygonConfig },
)
```

### viem Support

First-class viem support alongside ethers:

```typescript
import { createViemConfig, configure } from '@signinwithethereum/siwe'

configure(await createViemConfig({ publicClient }))
```

## Upgrade Checklist

1. ☐ Update package name: `siwe` → `@signinwithethereum/siwe`
2. ☐ Update all import paths
3. ☐ Add `nonce: generateNonce()` and `issuedAt: new Date().toISOString()` to all `SiweMessage` constructors
4. ☐ Add `domain` and `nonce` to all `verify()` calls
5. ☐ Add verification configuration (`configure()` / `createConfig()`)
6. ☐ Update error handling: `verify()` now throws by default
7. ☐ Replace any `validate()` calls with `verify()`
8. ☐ Replace `provider` option with `config` option in `verify()`
9. ☐ Remove `ethers` as a required dependency (keep as peer dep if using ethers-based config)

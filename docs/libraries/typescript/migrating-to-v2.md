# Migrating to SIWE TypeScript v2

## Overview

If you are using `siwe v1.1.6`, it is recommended to update to the latest version (`2.1.x`).

## Key Differences in v2.0

### Function Changes

The primary change is the replacement of the `validate(sig, provider)` function with a new `verify(VerifyParams, VerifyOpts)` method.

#### New Verification Parameters

```typescript
export interface VerifyParams {
  /** Signature of the message signed by the wallet */
  signature: string;

  /** RFC 4501 dns authority that is requesting the signing */
  domain?: string;

  /** Randomized token to prevent replay attacks, at least 8 alphanumeric characters */
  nonce?: string;

  /** ISO 8601 datetime string of the current time */
  time?: string;
}

export interface VerifyOpts {
  /** ethers provider to be used for EIP-1271 validation */
  provider?: providers.Provider;

  /** If the library should reject promises on errors, defaults to false */
  suppressExceptions?: boolean;
}
```

### Return Type Changes

The verification now returns a `SiweResponse` with a more detailed structure:

```typescript
export interface SiweResponse {
  /** Boolean representing if the message was verified successfully */
  success: boolean;

  /** If present and success is false, provides extra information on failure reason */
  error?: SiweError;

  /** Original message that was verified */
  data: SiweMessage;
}
```

### Additional Notes

- The new function makes it easier to automatically match fields like `domain`, `nonce`, and compare against current time.
- New error types have been introduced to provide more clarity on verification failures.

## Recommended Upgrade Path

1. Replace `validate()` calls with `verify()`
2. Update error handling to work with the new `SiweResponse` structure
3. Review and adapt to the new parameter and return type interfaces

For more detailed information, refer to the [SIWE TypeScript v2 release notes](https://blog.spruceid.com/sign-in-with-ethereum-typescript).
# Library Implementations

SIWE provides official libraries for integrating [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) authentication into your application.

## Official Libraries

### [TypeScript/JavaScript](typescript)

The original and most feature-complete SIWE implementation.

-   **Package**: [`@signinwithethereum/siwe`](https://www.npmjs.com/package/@signinwithethereum/siwe) on npm
-   **Platforms**: Node.js, Browser, React Native
-   **Features**: Provider-agnostic (viem, ethers), EIP-6492 support, strict mode
-   **Best for**: Web applications, React/Vue/Angular apps, Node.js backends

### [Rust](rust)

High-performance, pure Rust implementation.

-   **Package**: [`signinwithethereum`](https://crates.io/crates/signinwithethereum) on crates.io
-   **Platforms**: Server applications, CLI tools, embedded systems
-   **Features**: Zero-copy parsing, EIP-6492 support via alloy, serde serialization
-   **Best for**: High-performance backends, blockchain infrastructure, CLI tools

### [Python](python)

Idiomatic Python implementation built on pydantic and web3.py.

-   **Package**: [`signinwithethereum`](https://pypi.org/project/signinwithethereum/) on PyPI (imports as `siwe`)
-   **Platforms**: Python 3.10+ backends, scripts, data pipelines
-   **Features**: Pydantic-validated messages, EIP-1271 and EIP-6492 support via web3.py
-   **Best for**: Django / FastAPI / Flask backends, Python services and tooling

## Quick Comparison

| Feature | TypeScript | Rust | Python |
| --- | --- | --- | --- |
| Message Parsing | ✅ | ✅ | ✅ |
| Signature Verification (EIP-191) | ✅ | ✅ | ✅ |
| Contract Wallets (EIP-1271) | ✅ | ✅ (with `alloy` feature) | ✅ (with web3 provider) |
| Counterfactual Wallets (EIP-6492) | ✅ | ✅ (with `alloy` feature) | ✅ (with web3 provider) |
| Nonce Generation | ✅ | ✅ | ✅ |
| Serde Serialization | N/A | ✅ (with `serde` feature) | N/A (pydantic) |
| Browser Support | ✅ | ❌ | ❌ |
| Async Verification | ✅ | ✅ | ❌ (sync) |

## Specification Compliance

Both libraries implement:

- [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) (Sign In with Ethereum)
- [EIP-191](https://eips.ethereum.org/EIPS/eip-191) (Signed Data Standard)
- [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271) (Contract Signatures)
- [EIP-6492](https://eips.ethereum.org/EIPS/eip-6492) (Counterfactual Signatures)
- RFC 3986 (URI Specification)
- RFC 3339 (Timestamp Format)

All libraries generate identical EIP-4361 compliant messages — signatures created in one language can be verified in any other.

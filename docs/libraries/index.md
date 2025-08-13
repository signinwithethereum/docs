# Library Implementations

SIWE provides official libraries in multiple programming languages, making it easy to integrate Sign in with Ethereum authentication into applications regardless of your tech stack. Each library implements the [EIP-4361](../general-information/eip-4361-specification.md) specification and provides both message creation and signature verification capabilities.

## Supported Languages

### [TypeScript/JavaScript](typescript)

The original and most feature-complete SIWE implementation.

-   **Package**: `siwe` on npm
-   **Platforms**: Node.js, Browser, React Native
-   **Features**: Complete [EIP-4361](../general-information/eip-4361-specification.md) support, TypeScript definitions, extensive testing
-   **Best for**: Web applications, React/Vue/Angular apps, Node.js backends

### [Rust](rust)

High-performance implementation for Rust applications.

-   **Package**: `siwe` on crates.io
-   **Platforms**: Server applications, CLI tools, embedded systems
-   **Features**: Memory-safe, fast verification, serde serialization
-   **Best for**: High-performance backends, blockchain infrastructure, CLI tools

### [Python](python)

Pythonic implementation for Python developers.

-   **Package**: `siwe` on PyPI
-   **Platforms**: Django, Flask, FastAPI applications
-   **Features**: Async/await support, dataclass integration, type hints
-   **Best for**: Django/Flask apps, data analysis tools, ML/AI applications

### [Ruby](ruby)

Ruby gem with Rails integration support.

-   **Package**: `siwe` gem on RubyGems
-   **Platforms**: Rails applications, Sinatra, standalone Ruby scripts
-   **Features**: ActiveSupport integration, Rails middleware, comprehensive docs
-   **Best for**: Ruby on Rails applications, API backends

### [Go](go)

Go implementation for Go developers.

-   **Package**: `github.com/signinwithethereum/siwe-go`
-   **Platforms**: Go web servers, microservices, CLI applications
-   **Features**: Standard library compatibility, efficient verification, minimal dependencies
-   **Best for**: Microservices, Go web applications, infrastructure tools

### [Elixir](elixir)

Functional implementation for Elixir/Phoenix applications.

-   **Package**: `siwe` on Hex
-   **Platforms**: Phoenix applications, LiveView, OTP applications
-   **Features**: GenServer integration, Phoenix plugs, fault tolerance
-   **Best for**: Phoenix web apps, real-time applications, distributed systems

## Quick Start Comparison

Here's how to get started with each library:

### JavaScript/TypeScript

```bash
npm install siwe ethers
```

```javascript
import { SiweMessage } from 'siwe'

const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
})
```

### Rust

```toml
[dependencies]
siwe = "0.6"
```

```rust
use siwe::Message;

let message = Message {
    domain: "example.com".parse()?,
    address: "0x...".parse()?,
    uri: "https://example.com".parse()?,
    version: siwe::Version::V1,
    chain_id: 1,
    // ...
};
```

### Python

```bash
pip install siwe
```

```python
from siwe import SiweMessage

message = SiweMessage(
    domain="example.com",
    address="0x...",
    uri="https://example.com",
    version="1",
    chain_id=1,
)
```

### Ruby

```bash
gem install siwe
```

```ruby
require 'siwe'

message = Siwe::Message.new(
  domain: 'example.com',
  address: '0x...',
  uri: 'https://example.com',
  version: '1',
  chain_id: 1
)
```

### Go

```bash
go get github.com/signinwithethereum/siwe-go
```

```go
import "github.com/signinwithethereum/siwe-go"

message := siwe.Message{
    Domain:  "example.com",
    Address: "0x...",
    URI:     "https://example.com",
    Version: "1",
    ChainID: 1,
}
```

### Elixir

```elixir
# In mix.exs
{:siwe, "~> 0.3"}
```

```elixir
message = %Siwe.Message{
  domain: "example.com",
  address: "0x...",
  uri: "https://example.com",
  version: "1",
  chain_id: 1
}
```

## Feature Comparison

| Feature                | TypeScript     | Rust       | Python        | Ruby           | Go        | Elixir  |
| ---------------------- | -------------- | ---------- | ------------- | -------------- | --------- | ------- |
| Message Creation       | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| Signature Verification | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| Nonce Generation       | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| EIP-191 Support        | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| EIP-712 Support        | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| EIP-1271 Support       | ✅             | ✅         | ✅            | ✅             | ✅        | ✅      |
| Async/Await            | ✅             | ✅         | ✅            | ❌             | ✅        | ✅      |
| Type Safety            | ✅             | ✅         | ✅            | ❌             | ✅        | ✅      |
| Framework Integration  | React, Express | Axum, Warp | Django, Flask | Rails, Sinatra | Gin, Echo | Phoenix |
| Browser Support        | ✅             | ❌         | ❌            | ❌             | ❌        | ❌      |

## Choosing the Right Library

### For Web Applications

-   **Frontend**: Use TypeScript/JavaScript for React, Vue, Angular, or vanilla JS
-   **Backend**: Choose based on your existing backend language and framework

### For Mobile Applications

-   **React Native**: TypeScript/JavaScript
-   **Native iOS/Android**: Use appropriate native HTTP libraries with any backend

### For Enterprise Applications

-   **Java/.NET**: Use HTTP clients to communicate with SIWE backend services
-   **Enterprise backends**: Go, Rust, or TypeScript for high performance

### For Rapid Prototyping

-   **TypeScript/JavaScript**: Fastest to get started, works everywhere
-   **Python**: Great for data-driven applications and ML integration
-   **Ruby**: Excellent for Rails developers

## Installation Guides

Each library has specific installation and setup instructions:

-   **[TypeScript/JavaScript Setup](typescript#installation)**: npm, yarn, browser CDN
-   **[Rust Setup](rust)**: Cargo dependencies and features
-   **[Python Setup](python)**: pip, conda, virtual environments
-   **[Ruby Setup](ruby)**: gem, bundler, Rails integration
-   **[Go Setup](go)**: go mod, dependency management
-   **[Elixir Setup](elixir)**: mix deps, Phoenix integration

## Migration Guides

If you need to switch between libraries or upgrade versions:

-   [TypeScript v1 to v2 Migration](typescript#migration-guide)
-   [Cross-language Migration Tips](#cross-language-migration)
-   Version Compatibility Matrix (see below)

## Cross-Language Migration

When moving between different SIWE library implementations:

### Message Format Compatibility

All libraries generate identical [EIP-4361](../general-information/eip-4361-specification.md) compliant messages, ensuring signatures created in one language can be verified in any other.

### Configuration Mapping

```javascript
// JavaScript
const message = new SiweMessage({
	domain: 'example.com',
	address: '0x...',
	statement: 'Sign in to our app',
	uri: 'https://example.com',
	version: '1',
	chainId: 1,
	nonce: 'abc123',
	issuedAt: '2023-10-31T16:25:24Z',
})
```

```python
# Python equivalent
message = SiweMessage(
    domain="example.com",
    address="0x...",
    statement="Sign in to our app",
    uri="https://example.com",
    version="1",
    chain_id=1,
    nonce="abc123",
    issued_at="2023-10-31T16:25:24Z"
)
```

### Error Handling Patterns

Each library follows language-specific error handling conventions but provides equivalent functionality:

-   **JavaScript/TypeScript**: Promise-based with try/catch
-   **Rust**: Result types with match expressions
-   **Python**: Exception-based with try/except
-   **Ruby**: Exception-based with begin/rescue
-   **Go**: Error return values with if err != nil
-   **Elixir**: `{:ok, result} | {:error, reason}` tuples

## Community Libraries

Beyond official libraries, the community has created additional implementations:

-   **Java**: Community-maintained Spring Boot integration
-   **C#/.NET**: Community library for ASP.NET applications
-   **Swift**: iOS/macOS native implementation
-   **Kotlin**: Android-first implementation
-   **PHP**: Laravel and Symfony integrations

Visit our [GitHub repository](https://github.com/signinwithethereum/siwe) for links to community libraries.

## Version Compatibility

### Library Version Matrix

| Library | Current Version | EIP-4361 Spec | Node.js/Runtime | Notes |
|---------|----------------|---------------|-----------------|-------|
| TypeScript | 2.x | Full support | Node 16+ | Breaking changes from v1 |
| Rust | 0.6.x | Full support | N/A | Stable API |
| Python | 3.x | Full support | Python 3.7+ | Async support added |
| Ruby | 2.x | Full support | Ruby 2.7+ | Rails 6+ recommended |
| Go | 1.x | Full support | Go 1.18+ | Generics support |
| Elixir | 0.3.x | Full support | Elixir 1.12+ | Phoenix 1.6+ |

### Breaking Changes

When upgrading between major versions:

- **TypeScript v1 → v2**: Constructor API changes, see [migration guide](typescript/migrating-to-v2)
- **Python v2 → v3**: Async/await support, dataclass changes
- **Ruby v1 → v2**: Rails integration improvements

### Specification Compliance

All libraries implement:
- EIP-4361 (Sign-In with Ethereum)
- EIP-191 (Signed Data Standard)
- EIP-1271 (Contract Signatures)
- RFC 3986 (URI Specification)
- RFC 3339 (Timestamp Format)

## Contributing

All SIWE libraries are open source and welcome contributions:

-   **Bug Reports**: Create issues on the respective GitHub repositories
-   **Feature Requests**: Discuss new features in GitHub Discussions
-   **Pull Requests**: Follow each repository's contributing guidelines
-   **Documentation**: Help improve library documentation and examples
-   **Testing**: Add test cases for edge cases and new features

## Support

Get help with SIWE libraries:

-   **Documentation**: Each library has comprehensive docs and examples
-   **GitHub Issues**: Repository-specific support for bugs and questions
-   **Discord**: Real-time help from the community
-   **Stack Overflow**: Tag questions with `sign-in-with-ethereum`
-   **Twitter**: Follow [@signinwithethereum](https://twitter.com/signinwithethereum) for updates

---

_Ready to implement SIWE in your application? Choose your language and dive into the detailed documentation for your selected library._

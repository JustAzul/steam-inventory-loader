# Azul Steam Inventory Loader

A modern, robust Steam inventory loader with built-in error retry, request delay, and proxy support. Built with Clean Architecture principles for maximum maintainability and extensibility.

[![npm version](https://badge.fury.io/js/azul-steam-inventory-loader.svg)](https://badge.fury.io/js/azul-steam-inventory-loader)

---

## Features

- **Clean Architecture**: Enforced separation of concerns for a highly modular and testable codebase.
- **Resilient Fetching**: Automatic request retries with configurable delay on network or Steam API errors.
- **Proxy Support**: Easily configure an HTTP proxy for all requests to Steam.
- **TypeScript Native**: Written entirely in TypeScript with strict type safety.
- **Dependency Injection**: Leverages `tsyringe` for robust dependency management.
- **Extensible**: Designed to be easily extended with custom logic and strategies.

---

## Installation

```bash
npm install azul-steam-inventory-loader
```

---

## Usage

Here's a basic example of how to load a user's inventory:

```typescript
import { createInventoryLoader, LoaderConfig, SteamItemEntity } from 'azul-steam-inventory-loader';

async function main() {
  const config: LoaderConfig = {
    proxyAddress: '', // Optional: 'http://user:pass@host:port'
    language: 'english',
    maxRetries: 3,
    itemsPerPage: 2000,
    tradableOnly: true,
  };

  const inventoryLoader = createInventoryLoader(config);

  try {
    const items: SteamItemEntity[] = await inventoryLoader.loadInventory({
      steamID64: '76561198084883729',
      appID: 730, // CS:GO
      contextID: '2',
    });

    console.log(`Loaded ${items.length} items.`);
    // ... process items
  } catch (error) {
    console.error('Failed to load inventory:', error);
  }
}

main();
```

---

## Configuration

The `createInventoryLoader` function accepts a `LoaderConfig` object with the following properties:

| Option          | Type      | Default     | Description                                             |
|-----------------|-----------|-------------|---------------------------------------------------------|
| `proxyAddress`  | `string`  | `''`        | URL of the HTTP proxy to use for requests.              |
| `language`      | `string`  | `'english'` | The language for item descriptions.                     |
| `maxRetries`    | `number`  | `3`         | The maximum number of retries for failed requests.      |
| `itemsPerPage`  | `number`  | `2000`      | The number of items to fetch per page.                  |
| `tradableOnly`  | `boolean` | `true`      | Whether to fetch only tradable items.                   |

---

## Development

This project uses `npm` for package management.

### Available Scripts

- **`npm run build`**: Compiles the TypeScript source code.
- **`npm run format`**: Formats the code using Prettier.
- **`npm run lint`**: Lints the code using ESLint.
- **`npm run test`**: Runs the Jest test suite.
- **`npm run type-check`**: Runs the TypeScript compiler without emitting files to check for type errors.

### Project Structure

The project follows Clean Architecture principles:

```
src/
├── domain/         # Core business logic, entities, and rules.
├── application/    # Use cases and application-specific logic.
├── infra/          # Frameworks, drivers, and external dependencies.
├── presentation/   # Entry points and public-facing APIs.
└── shared/         # Cross-cutting concerns.
```

---

## License

This project is licensed under the **ISC License**. See the `LICENSE` file for details. 
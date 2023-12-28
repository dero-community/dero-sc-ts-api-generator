# dero-sc-ts-api-generator

# Installation

* Requires [`Bun.js`](https://bun.sh/)

```sh
$ bun install -g dero-sc-ts-api-generator
```

# Usage

## Config

```sh
# Create the config file
$ dstag init
```

Example `dstag.config.json` file:
```json
{
    "source": "src", // source folder with .bas files
    "build": {
        "target": "../frontend/src/api" // target folder in TS frontend app
    }
}
```

## Build

```sh
# Build APIs
$ dstag build
```

The `build` command reads `dstag.config.json` to:
* Generate a `lib.ts` file containing common code in APIs.
* Read all SCs in the `source` folder:
  * Ganerate a `<Smart Contract Name>/api.ts` for each smart contract
* Move the generated files in both the local `dist` folder and the target folder so you can write tests locally and have the api available in your frontend.

# Development

To build:

```bash
bun run build
```


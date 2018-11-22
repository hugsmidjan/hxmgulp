# Stylutils

Hugsmiðjan's favourite Stylus utilses.

```
yarn add --dev github:hugsmidjan/stylutils#semver:^1.0.0
```

## Direct usage

The direct way to consume the utils (and one which is possibly not so 
future-proof) is to require them from your local `node_modules` path.

```styl
@require '../node_modules/stylutils/normalize'
@require '../node_modules/stylutils/utils'
// etc...
```

## Using a local copy

The other way is to install a local copy of the stylutils files, and 
the CLI command `stylutils` helps with that. Just run...

```
stylutils path/to/src/lib/
```

This copies all the utility files into a folder named 
`path/to/src/lib/stylutils` under your project root, so you can do:

```styl
@require 'lib/stylutils/normalize'
@require 'lib/stylutils/utils'
// etc...
```

The target path is saved under the key `"vendorcss"` in your `package.json`.

From then on, invoking the `stylutils` command with no arguments will update 
the files in your `package.json`'s `"vendorcss"` folder.

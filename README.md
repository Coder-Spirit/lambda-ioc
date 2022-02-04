# @coderspirit/lambda-ioc

[![NPM version](https://img.shields.io/npm/v/@coderspirit/lambda-ioc.svg?style=flat)](https://www.npmjs.com/package/@coderspirit/lambda-ioc)
[![TypeScript](https://badgen.net/npm/types/@coderspirit/lambda-ioc)](http://www.typescriptlang.org/)
[![License](https://badgen.net/npm/license/@coderspirit/lambda-ioc)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@coderspirit/lambda-ioc.svg?style=flat)](https://www.npmjs.com/package/@coderspirit/lambda-ioc)
[![Known Vulnerabilities](https://snyk.io//test/github/Coder-Spirit/lambda-ioc/badge.svg?targetFile=package.json)](https://snyk.io//test/github/Coder-Spirit/lambda-ioc?targetFile=package.json)
[![Security Score](https://snyk-widget.herokuapp.com/badge/npm/@coderspirit%2Flambda-ioc/badge.svg)](https://snyk.io/advisor/npm-package/@coderspirit/lambda-ioc)

> Pure functional (λ) dependency injection 💉 for TypeScript (inspired by Diddly)

**NOTE:** This is a "fork" of Tom Sherman's
**[Diddly library](https://github.com/tom-sherman/diddly)**, who deserves most
credit for this work.

## Install instructions

### Node

```
# With NPM
npm install @coderspirit/lambda-ioc

# Or with Yarn:
yarn add @coderspirit/lambda-ioc
```

### [Deno](https://deno.land/)

`Lambda-IoC` is served through different CDNs
```typescript
import { ... } from 'https://denopkg.com/Coder-Spirit/lambda-ioc@[VERSION]/lambda-ioc/deno/index.ts'
import { ... } from 'https://deno.land/x/lambda_ioc@[VERSION]/lambda-ioc/deno/index.ts'
```

## Benefits

- 100% type safe:
  - The type checker will complain if we try to resolve unregistered
    dependencies.
  - The type checker will complain if we try to register new dependencies that
    depend on unregistered dependencies, or if there is any kind of type
    mismatch.
- Purely functional
- Immutable
- Circular dependencies are impossible

## Drawbacks

- All dependencies must be declared "in order".
  - This implies that this IoC container cannot be used in combination with some
    auto-wiring solutions, such as IoC decorators.
- The involved types are a bit convoluted:
  - They might cause the type checker to be slow.
  - In some situations, the type checker might be unable to infer the involved
    types due to excessive "nested types" depth.

## Example

```ts
import { createContainer } from '@coderspirit/lambda-ioc'

function printNameAndAge(name: string, age: number) {
  console.log(`${name} is aged ${age}`)
}
​
const container = createContainer()
  .registerValue('someAge', 5)
  .registerValue('someName', 'Timmy')
  .register('fn', func(printNameAndAge, 'someName', 'someAge'))
​
// For now it's always async, we'll improve its API to decide when to expose
// the registered dependencies synchronously or asynchronoyusly in a smart way.
const print = await container.resolve('fn')
print() // Prints "Timmy is aged 5"
```

> [!WARNING]
> The development of this package has been moved to https://github.com/Coder-Spirit/nominal/

# @coderspirit/lambda-ioc

[![NPM version](https://img.shields.io/npm/v/@coderspirit/lambda-ioc.svg?style=flat)](https://www.npmjs.com/package/@coderspirit/lambda-ioc)
[![TypeScript](https://badgen.net/npm/types/@coderspirit/lambda-ioc)](http://www.typescriptlang.org/)
[![License](https://badgen.net/npm/license/@coderspirit/lambda-ioc)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/@coderspirit/lambda-ioc.svg?style=flat)](https://www.npmjs.com/package/@coderspirit/lambda-ioc)
[![Known Vulnerabilities](https://snyk.io//test/github/Coder-Spirit/lambda-ioc/badge.svg?targetFile=package.json)](https://snyk.io//test/github/Coder-Spirit/lambda-ioc?targetFile=package.json)
[![Security Score](https://snyk-widget.herokuapp.com/badge/npm/@coderspirit%2Flambda-ioc/badge.svg)](https://snyk.io/advisor/npm-package/@coderspirit/lambda-ioc)

> Super type safe dependency injection 💉 for TypeScript (inspired by Diddly)

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

## Example

```ts
import {
  cc2ic, // Stands for "class-constructor to interface-constructor"
  createContainer,
  func
} from '@coderspirit/lambda-ioc'

function printNameAndAge(name: string, age: number) {
  console.log(`${name} is aged ${age}`)
}

interface Human {
  age: number
  name: readonly string
}

class Person implements Human {
  constructor(
    public readonly age: number,
    public readonly name: string
  ) {}
}
​
const container = createContainer()
  .registerValue('someAge', 5)
  .registerValue('someName', 'Timmy')
  // We can register functions
  .register('fn', func(printNameAndAge, 'someName', 'someAge'))
  // And constructors too:
  .registerConstructor('Person', Person, 'someAge', 'someName')
  // In case we want to register a "concrete" constructor to provide an
  // abstract interface, we'll have to apply a small hack, using `cc2ic`:
  .registerConstructor('Human', cc2ic<Human>()(Person), 'someAge', 'someName')
  // We can "define groups" by using `:` as an infix, the group's name will be
  // the first part of the string before `:`.
  // Groups can be used in all "register" methods.
  .registerValue('group1:a', 1) // group == 'group1'
  .registerValue('group1:b', 2)
  .registerValue('group2:a', 3) // group == 'group2'
  .registerValue('group2:b', 4)
​
// We can resolve registered functions
const print = container.resolve('fn')
print() // Prints "Timmy is aged 5"

// We can resolve registered constructors
const person = container.resolve('Person')
console.print(person.age) // Prints "5"
console.print(person.name) // Prints "Timmy"

// We can resolve registered "groups"
container.resolveGroup('group1') // ~ [1, 2], not necessarily in the same order
container.resolveGroup('group2') // ~ [3, 4], not necessarily in the same order

// We can also resolve the container itself, and the return type will always be
// up to date. This is useful if we want to use the container as a factory for
// some of your dependencies.
const resolvedContainer = container.resolve('$')
```

It is also possible to register and resolve asynchronous factories and
dependencies. If you are curious, just try out:
- `registerAsync`
- `registerAsyncConstructor`
- `resolveAsync`

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

## Differences respect to Diddly

- First-class support for Deno.
- First-class support for asynchronous dependency resolution.
- Stricter types for dependencies re-registration.
- Groups registration and resolution: very useful when we need to resolve all
  dependencies belonging to a same category.
- Self-resolution. The container is able to resolve itself, to be used as a
  factory.
- The container interface has been split into `ReaderContainer` and
  `WriterContainer`, making it easier to use precise types.
- More extense documentation.

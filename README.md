# @coderspirit/lambda-ioc

> Pure functional (λ) dependency injection 💉 for TypeScript (inspired by Diddly)

**NOTE:** This is a "fork" of Tom Sherman's
**[Diddly library](https://github.com/tom-sherman/diddly)**, who deserves most
credit for this work.

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
import { createContainer } from '@coderspirit/lambda-ioc';

function printNameAndAge(name: string, age: number) {
  console.log(`${name} is aged ${age}`);
}
​
const container = createContainer()
  .register('someAge', value(5))
  .register('someName', value('Timmy'))
  .register('fn', func(printNameAndAge, 'someName', 'someAge'));
​
const print = container.resolve('fn');
print(); // Prints "Timmy is aged 5"
```

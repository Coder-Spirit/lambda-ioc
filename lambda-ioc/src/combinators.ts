import {
  AsyncDependencyFactory,
  ContainerKey,
  ReadableContainer,
  ReadableSyncContainer,
  SyncDependencyFactory,
} from './container'
import { ParamsToResolverKeys, TupleO, Zip } from './util'

/**
 * Given a dependency factory, returns a new factory that will always resolve
 * the same instance of the dependency.
 */
export function singleton<
  TVal,
  TSyncDependencies extends Record<ContainerKey, unknown>,
>(
  factory: SyncDependencyFactory<
    TVal,
    ReadableSyncContainer<TSyncDependencies>
  >,
): SyncDependencyFactory<TVal, ReadableSyncContainer<TSyncDependencies>> {
  let result: Awaited<TVal> | undefined

  return (container) => {
    if (!result) {
      result = factory(container)
    }
    return result
  }
}

/**
 * Given a dependency factory, returns a new asynchronous factory that will
 * always resolve the same instance of the dependency.
 */
export function asyncSingleton<
  TVal,
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
>(
  factory: AsyncDependencyFactory<
    TVal,
    ReadableContainer<TSyncDependencies, TAsyncDependencies>
  >,
): AsyncDependencyFactory<
  TVal,
  ReadableContainer<TSyncDependencies, TAsyncDependencies>
> {
  let result: TVal | undefined

  return async (container) => {
    if (!result) {
      result = await factory(container)
    }
    return result
  }
}

/**
 * Given a function, and a list of named dependencies, creates a new dependency
 * factory that will resolve a parameterless function wrapping the original
 * function and its resolved dependencies.
 */
export function func<
  TParams extends readonly unknown[],
  TReturn,
  TSyncDependencies extends ParamsToResolverKeys<TParams>,
>(
  fn: (...args: TParams) => Awaited<TReturn>,
  ...args: TSyncDependencies
): SyncDependencyFactory<
  () => TReturn,
  SyncFuncContainer<TParams, TSyncDependencies>
> {
  return (container: SyncFuncContainer<TParams, TSyncDependencies>) => {
    const resolvedArgs = args.map((arg) =>
      container.resolve(
        // This is ugly as hell, but I did not want to apply ts-ignore
        arg as Parameters<
          SyncFuncContainer<TParams, TSyncDependencies>['resolve']
        >[0],
      ),
    ) as unknown as TParams

    return () => fn(...resolvedArgs)
  }
}

// Class-Constructor to Interface-Constructor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cc2ic<I>(): <CC extends new (...args: any[]) => I>(cc: CC) => AsInterfaceCtor<I, CC> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return identity as <C extends I, CC extends new (...args: any[]) => C>(
    cc: CC,
  ) => AsInterfaceCtor<I, CC>
}

// -----------------------------------------------------------------------------
// Private Types
// -----------------------------------------------------------------------------
type SyncFuncContainer<
  TParams extends readonly unknown[],
  TSyncDependencies extends ParamsToResolverKeys<TParams>,
> = ReadableSyncContainer<
  TupleO<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Extract<Zip<TSyncDependencies, TParams>, readonly [ContainerKey, any][]>
  >
>

// Converts a "class constructor" type to an "interface constructor" type
type AsInterfaceCtor<
  I, // The interface we are interested on
  // We have to pass CC to know its constructor parameters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CC extends new (...args: any[]) => I = new () => I,
> = CC extends new (...args: infer A) => infer C
  ? C extends I
    ? new (...args: A) => I
    : never
  : never

// -----------------------------------------------------------------------------
// Private Functions
// -----------------------------------------------------------------------------

// Helper function, here to avoid creating too many anonymous lambdas
const identity = (x: unknown) => x

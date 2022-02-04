import {
  ContainerKey,
  ReadableContainer,
  SyncDependencyFactory,
} from './container'
import { ParamsToResolverKeys, TupleO, Zip } from './util'

/**
 * Given a dependency factory, returns a new factory that will always resolve
 * the same instance of the dependency.
 */
export function singleton<
  TVal,
  TDependencies extends Record<ContainerKey, unknown>,
>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  factory: SyncDependencyFactory<TVal, ReadableContainer<TDependencies, {}>>,
  // eslint-disable-next-line @typescript-eslint/ban-types
): SyncDependencyFactory<TVal, ReadableContainer<TDependencies, {}>> {
  let result: Awaited<TVal> | undefined

  return (container) => {
    if (!result) {
      result = factory(container)
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
  TDependencies extends ParamsToResolverKeys<TParams>,
>(
  fn: (...args: TParams) => Awaited<TReturn>,
  ...args: TDependencies
): SyncDependencyFactory<
  () => TReturn,
  SyncFuncContainer<TParams, TDependencies>
> {
  return (container: SyncFuncContainer<TParams, TDependencies>) => {
    const resolvedArgs = args.map((arg) =>
      container.resolve(
        // This is ugly as hell, but I did not want to apply ts-ignore
        arg as Parameters<
          SyncFuncContainer<TParams, TDependencies>['resolve']
        >[0],
      ),
    ) as unknown as TParams

    return () => fn(...resolvedArgs)
  }
}

/**
 * Given a class constructor, and a list of named dependencies, creates a new
 * dependency factory that will resolve a new instance of the class.
 */
export function constructor<
  TParams extends readonly unknown[],
  TClass,
  TDependencies extends ParamsToResolverKeys<TParams>,
>(
  constructor: new (...args: TParams) => Awaited<TClass>,
  ...args: TDependencies
): SyncDependencyFactory<TClass, SyncFuncContainer<TParams, TDependencies>> {
  return (container: SyncFuncContainer<TParams, TDependencies>) => {
    const resolvedArgs = args.map((arg) =>
      container.resolve(
        // This is ugly as hell, but I did not want to apply ts-ignore
        arg as Parameters<
          SyncFuncContainer<TParams, TDependencies>['resolve']
        >[0],
      ),
    ) as unknown as TParams

    return new constructor(...resolvedArgs)
  }
}

// -----------------------------------------------------------------------------
// Private Types
// -----------------------------------------------------------------------------
type SyncFuncContainer<
  TParams extends readonly unknown[],
  TSyncDependencies extends ParamsToResolverKeys<TParams>,
> = ReadableContainer<
  TupleO<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Extract<Zip<TSyncDependencies, TParams>, readonly [ContainerKey, any][]>
  >,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
>

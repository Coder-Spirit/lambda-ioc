import { Container, ContainerKey, DependencyFactory } from './container'
import { ParamsToResolverKeys, TupleO, Zip } from './util'

/**
 *
 */
export function singleton<
  TVal,
  TDependencies extends Record<ContainerKey, unknown>,
>(
  factory: DependencyFactory<TVal, Container<TDependencies>>,
): DependencyFactory<TVal, Container<TDependencies>> {
  let result: TVal | undefined

  return async (container) => {
    if (!result) {
      result = await factory(container)
    }
    return result
  }
}

type FuncContainer<
  TParams extends readonly unknown[],
  TDependencies extends ParamsToResolverKeys<TParams>,
> = Container<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TupleO<Extract<Zip<TDependencies, TParams>, readonly [ContainerKey, any][]>>
>

export function func<
  TParams extends readonly unknown[],
  TReturn,
  TDependencies extends ParamsToResolverKeys<TParams>,
>(
  fn: (...args: TParams) => Awaited<TReturn>,
  ...args: TDependencies
): DependencyFactory<() => TReturn, FuncContainer<TParams, TDependencies>> {
  return async (container: FuncContainer<TParams, TDependencies>) => {
    const argPromises = args.map((arg) =>
      container.resolve(
        // This is ugly as hell, but I did not want to apply ts-ignore
        arg as Parameters<FuncContainer<TParams, TDependencies>['resolve']>[0],
      ),
    )
    const resolvedArgs = (await Promise.all(
      argPromises as Promise<unknown>[],
    )) as unknown as TParams

    return () => fn(...resolvedArgs)
  }
}

export function constructor<
  TParams extends readonly unknown[],
  TClass,
  TDependencies extends ParamsToResolverKeys<TParams>,
>(
  constructor: new (...args: TParams) => TClass,
  ...args: TDependencies
): DependencyFactory<TClass, FuncContainer<TParams, TDependencies>> {
  return async (container: FuncContainer<TParams, TDependencies>) => {
    const argPromises = args.map((arg) =>
      container.resolve(
        // This is ugly as hell, but I did not want to apply ts-ignore
        arg as Parameters<FuncContainer<TParams, TDependencies>['resolve']>[0],
      ),
    )
    const resolvedArgs = (await Promise.all(
      argPromises as Promise<unknown>[],
    )) as unknown as TParams

    return new constructor(...resolvedArgs)
  }
}

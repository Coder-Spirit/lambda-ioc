/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ContainerKey = string | symbol

export type Zip<A extends readonly unknown[], B extends readonly unknown[]> = {
  [K in keyof A]: K extends keyof B ? [A[K], B[K]] : never
}

export type ParamsToResolverKeys<T extends readonly unknown[] | []> = {
  [K in keyof T]: ContainerKey
}

export type ContextualParamsToResolverKeys<
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
  TParams extends
    | readonly (
        | TSyncDependencies[keyof TSyncDependencies]
        | TAsyncDependencies[keyof TAsyncDependencies]
      )[]
    | [],
> = {
  [K in keyof TParams]:
    | KeysMatching<TSyncDependencies, TParams[K]>
    | KeysMatching<TAsyncDependencies, TParams[K]>
}

type KeysMatching<Collection, Value> = {
  [K in keyof Collection]-?: Collection[K] extends Value ? K : never
}[keyof Collection]

export type MergeNoDuplicates<A extends {}, B extends {}> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? never
      : B[K]
    : K extends keyof A
    ? A[K]
    : never
}

type Head<T extends readonly unknown[]> = T[0]
type Tail<T extends readonly unknown[]> = T extends readonly [any, ...infer U]
  ? U
  : []

export type TupleO<T extends readonly [ContainerKey, any][]> = _TupleO<
  Head<T>,
  Tail<T>,
  {}
>

type _TupleO<
  T extends [ContainerKey, any],
  TRest extends readonly [ContainerKey, any][],
  I extends {},
> = [] extends TRest
  ? MergeNoDuplicates<
      I,
      {
        [k in T[0]]: Extract<T, [ContainerKey, any]>[1]
      }
    >
  : _TupleO<
      Head<TRest>,
      Tail<TRest>,
      MergeNoDuplicates<
        I,
        {
          [k in T[0]]: Extract<T, [ContainerKey, any]>[1]
        }
      >
    >

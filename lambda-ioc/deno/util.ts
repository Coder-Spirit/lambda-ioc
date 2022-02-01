/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ContainerKey } from './container.ts';

export type Zip<A extends readonly unknown[], B extends readonly unknown[]> = {
  [K in keyof A]: K extends keyof B ? [A[K], B[K]] : never
}

export type ParamsToResolverKeys<T extends readonly unknown[] | []> = { [K in keyof T]: ContainerKey }

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

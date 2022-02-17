/* eslint-disable @typescript-eslint/ban-types */

import { ContainerKey, ContextualParamsToResolverKeys } from './util.ts';

type ExtractPrefix<S extends ContainerKey> =
  S extends `${infer Prefix}:${string}` ? Prefix : never

type ExtractPrefixedValues<
  Prefix extends string,
  Struct extends Record<ContainerKey, unknown>,
  BaseKeys extends keyof Struct = keyof Struct,
> = BaseKeys extends `${Prefix}:${infer U}` ? Struct[`${Prefix}:${U}`] : never

export interface SyncDependencyFactory<
  T,
  TContainer extends ReadableSyncContainer<Record<ContainerKey, unknown>>,
> {
  (container: TContainer): Awaited<T>
}

export interface AsyncDependencyFactory<
  T,
  TContainer extends ReadableContainer<
    Record<ContainerKey, unknown>,
    Record<ContainerKey, unknown>
  >,
> {
  (container: TContainer): Promise<T>
}

/**
 * Represents a dependency factory: a function that, given an IoC container, it
 * is able to instantiate a specific dependency.
 */
export interface DependencyFactory<
  T,
  TContainer extends ReadableContainer<
    Record<ContainerKey, unknown>,
    Record<ContainerKey, unknown>
  >,
> extends SyncDependencyFactory<T, TContainer>,
    AsyncDependencyFactory<T, TContainer> {}

export interface ReadableSyncContainer<
  TSyncDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Resolve a "synchronous" dependency from the container.
   *
   * @param name The "name" of the dependency (can be a symbol).
   */
  resolve<TName extends keyof TSyncDependencies>(
    name: TName,
  ): TSyncDependencies[TName]
}

export interface ReadableAsyncContainer<
  TAsyncDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Resolve an "asynchronous" dependency from the container.
   *
   * @param name The "name" of the dependency (can be a symbol).
   */
  resolveAsync<TName extends keyof TAsyncDependencies>(
    name: TName,
  ): Promise<TAsyncDependencies[TName]>
}

/**
 * Represents a read-only version of a type-safe IoC container with "auto-wired"
 * dependencies resolution.
 */
export interface ReadableContainer<
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
> extends ReadableSyncContainer<TSyncDependencies>,
    ReadableAsyncContainer<TAsyncDependencies> {}

export interface RedableGroupContainer<
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
> {
  resolveGroup<
    GroupName extends keyof TSyncDependencies extends ContainerKey
      ? ExtractPrefix<keyof TSyncDependencies>
      : never,
  >(
    groupName: GroupName,
  ): keyof TSyncDependencies extends ContainerKey
    ? ExtractPrefixedValues<GroupName, TSyncDependencies>[]
    : never

  resolveGroupAsync<
    GroupName extends keyof TAsyncDependencies extends ContainerKey
      ? ExtractPrefix<keyof TAsyncDependencies>
      : never,
  >(
    groupName: GroupName,
  ): Promise<
    keyof TAsyncDependencies extends ContainerKey
      ? ExtractPrefixedValues<GroupName, TAsyncDependencies>[]
      : never
  >
}

/**
 * Represents a write-only version of a type-safe IoC container with
 * "auto-wired" dependencies resolution.
 */
export interface WritableContainer<
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Register a new synchronous dependency factory.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency A dependency factory.
   */
  register<
    TName extends ContainerKey,
    TDependency extends TName extends keyof TSyncDependencies
      ? TSyncDependencies[TName]
      : TName extends keyof TAsyncDependencies
      ? never
      : unknown,
  >(
    name: TName,
    dependency: SyncDependencyFactory<
      TDependency,
      ReadableSyncContainer<TSyncDependencies>
    >,
  ): Container<
    {
      [TK in
        | keyof TSyncDependencies
        | TName]: TK extends keyof TSyncDependencies
        ? TName extends TK
          ? TDependency
          : TSyncDependencies[TK]
        : TDependency
    },
    TAsyncDependencies
  >

  /**
   * Register a new asynchronous dependency factory.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency A dependency factory.
   */
  registerAsync<
    TName extends ContainerKey,
    TDependency extends TName extends keyof TSyncDependencies
      ? never
      : TName extends keyof TAsyncDependencies
      ? TAsyncDependencies[TName]
      : unknown,
  >(
    name: TName,
    dependency: AsyncDependencyFactory<
      TDependency,
      ReadableContainer<TSyncDependencies, TAsyncDependencies>
    >,
  ): Container<
    TSyncDependencies,
    {
      [TK in
        | keyof TAsyncDependencies
        | TName]: TK extends keyof TAsyncDependencies
        ? TName extends TK
          ? TDependency
          : TAsyncDependencies[TK]
        : TDependency
    }
  >

  /**
   * Registers a new constructor that might have asynchronous-resolvable
   * dependencies. This method is helpful when the constructor combinator is
   * not powerful enough (as it's only able to resolve synchronously).
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param constructor A class constructor, that will be use to resolve the
   *                    registered dependency.
   * @param args A list of dependency names that will be passed to the
   *             registered constructor at construction time, when we try to
   *             resolve the dependency.
   */
  registerAsyncConstructor<
    TName extends ContainerKey,
    TParams extends readonly (
      | TSyncDependencies[keyof TSyncDependencies]
      | TAsyncDependencies[keyof TAsyncDependencies]
    )[],
    TClass extends TName extends keyof TSyncDependencies
      ? never
      : TName extends keyof TAsyncDependencies
      ? TAsyncDependencies[TName]
      : unknown,
    TDependencies extends ContextualParamsToResolverKeys<
      TSyncDependencies,
      TAsyncDependencies,
      TParams
    >,
  >(
    name: TName,
    constructor: new (...args: TParams) => TClass,
    ...args: TDependencies
  ): Container<
    TSyncDependencies,
    {
      [TK in
        | keyof TAsyncDependencies
        | TName]: TK extends keyof TAsyncDependencies
        ? TName extends TK
          ? TClass
          : TAsyncDependencies[TK]
        : TClass
    }
  >

  /**
   * Register an already instantiated dependency.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency An already instantiated value.
   */
  registerValue<
    TName extends ContainerKey,
    TDependency extends TName extends keyof TSyncDependencies
      ? TSyncDependencies[TName]
      : TName extends keyof TAsyncDependencies
      ? never
      : unknown,
  >(
    name: TName,
    dependency: TDependency,
  ): Container<
    {
      [TK in
        | keyof TSyncDependencies
        | TName]: TK extends keyof TSyncDependencies
        ? TName extends TK
          ? TDependency
          : TSyncDependencies[TK]
        : TDependency
    },
    TAsyncDependencies
  >
}

/**
 * Represents a type-safe IoC container with "auto-wired" dependencies
 * resolution
 */
export interface Container<
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
> extends ReadableContainer<TSyncDependencies, TAsyncDependencies>,
    RedableGroupContainer<TSyncDependencies, TAsyncDependencies>,
    WritableContainer<TSyncDependencies, TAsyncDependencies> {}

/**
 * Creates a new type-safe IoC container.
 */
export function createContainer(): Container<{}, {}> {
  return __createContainer({}, {})
}

// -----------------------------------------------------------------------------
// Private Types
// -----------------------------------------------------------------------------
type SyncFactoriesToValues<
  TDependencyFactories extends Record<
    ContainerKey,
    SyncDependencyFactory<unknown, Container<Record<ContainerKey, unknown>, {}>>
  >,
> = {} extends TDependencyFactories
  ? {}
  : {
      [name in keyof TDependencyFactories]: TDependencyFactories[name] extends SyncDependencyFactory<
        infer T,
        Container<Record<ContainerKey, unknown>, {}>
      >
        ? T
        : never
    }

type AsyncFactoriesToValues<
  TDependencyFactories extends Record<
    ContainerKey,
    AsyncDependencyFactory<
      unknown,
      Container<Record<ContainerKey, unknown>, Record<ContainerKey, unknown>>
    >
  >,
> = {} extends TDependencyFactories
  ? {}
  : {
      [name in keyof TDependencyFactories]: TDependencyFactories[name] extends AsyncDependencyFactory<
        infer T,
        Container<Record<ContainerKey, unknown>, Record<ContainerKey, unknown>>
      >
        ? Awaited<T>
        : never
    }

// -----------------------------------------------------------------------------
// Private Functions
// -----------------------------------------------------------------------------
function __createContainer<
  TSyncDependencyFactories extends Record<
    ContainerKey,
    SyncDependencyFactory<
      unknown,
      Container<Record<ContainerKey, unknown>, Record<ContainerKey, unknown>>
    >
  >,
  TAsyncDependencyFactories extends Record<
    ContainerKey,
    AsyncDependencyFactory<
      unknown,
      Container<Record<ContainerKey, unknown>, Record<ContainerKey, unknown>>
    >
  >,
>(
  syncDependencies: TSyncDependencyFactories,
  asyncDependencies: TAsyncDependencyFactories,
): Container<
  SyncFactoriesToValues<TSyncDependencyFactories>,
  AsyncFactoriesToValues<TAsyncDependencyFactories>
> {
  // These are "local" types, useful for the type inference
  type TSyncDependencies = SyncFactoriesToValues<TSyncDependencyFactories>
  type TAsyncDependencies = AsyncFactoriesToValues<TAsyncDependencyFactories>
  type ContainerWithNewSyncDep<
    TName extends ContainerKey,
    TDependency,
  > = Container<
    {
      [TK in
        | keyof TSyncDependencies
        | TName]: TK extends keyof TSyncDependencies
        ? TName extends TK
          ? TDependency
          : TSyncDependencies[TK]
        : TDependency
    },
    AsyncFactoriesToValues<TAsyncDependencyFactories>
  >
  type ContainerWithNewAsyncDep<
    TName extends ContainerKey,
    TDependency,
  > = Container<
    SyncFactoriesToValues<TSyncDependencyFactories>,
    {
      [TK in
        | keyof TAsyncDependencies
        | TName]: TK extends keyof TAsyncDependencies
        ? TName extends TK
          ? TDependency
          : TAsyncDependencies[TK]
        : TDependency
    }
  >

  return {
    register<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: SyncDependencyFactory<
        TDependency,
        Container<TSyncDependencies, {}>
      >,
    ): ContainerWithNewSyncDep<TName, TDependency> {
      if (name in syncDependencies) {
        return __createContainer(
          {
            ...syncDependencies,
            [name]: dependency,
          },
          asyncDependencies,
        ) as ContainerWithNewSyncDep<TName, TDependency>
      } else {
        ;(syncDependencies as Record<TName, unknown>)[name] = dependency
        return __createContainer(
          syncDependencies,
          asyncDependencies,
        ) as ContainerWithNewSyncDep<TName, TDependency>
      }
    },

    registerAsync<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: AsyncDependencyFactory<
        TDependency,
        Container<TSyncDependencies, TAsyncDependencies>
      >,
    ): ContainerWithNewAsyncDep<TName, TDependency> {
      if (name in asyncDependencies) {
        return __createContainer(syncDependencies, {
          ...asyncDependencies,
          [name]: dependency,
        }) as ContainerWithNewAsyncDep<TName, TDependency>
      } else {
        ;(asyncDependencies as Record<TName, unknown>)[name] = dependency
        return __createContainer(
          syncDependencies,
          asyncDependencies,
        ) as ContainerWithNewAsyncDep<TName, TDependency>
      }
    },

    registerAsyncConstructor<
      TName extends ContainerKey,
      TParams extends readonly (
        | TSyncDependencies[keyof TSyncDependencies]
        | TAsyncDependencies[keyof TAsyncDependencies]
      )[],
      TClass extends TName extends keyof TSyncDependencies
        ? never
        : TName extends keyof TAsyncDependencies
        ? TAsyncDependencies[TName]
        : unknown,
      TDependencies extends ContextualParamsToResolverKeys<
        TSyncDependencies,
        TAsyncDependencies,
        TParams
      >,
    >(
      name: TName,
      constructor: new (...args: TParams) => TClass,
      ...args: TDependencies
    ): ContainerWithNewAsyncDep<TName, TClass> {
      const factory = async (container: typeof this) => {
        const argPromises = args.map((arg) => {
          return (arg as string) in syncDependencies
            ? container.resolve(arg as keyof TSyncDependencies)
            : container.resolveAsync(arg as keyof TAsyncDependencies)
        })
        const resolvedParams = (await Promise.all(
          argPromises,
        )) as unknown as TParams

        return new constructor(...resolvedParams)
      }

      if (name in asyncDependencies) {
        return __createContainer(syncDependencies, {
          ...asyncDependencies,
          [name]: factory,
        }) as ContainerWithNewAsyncDep<TName, TClass>
      } else {
        ;(asyncDependencies as Record<TName, unknown>)[name] = factory
        return __createContainer(
          syncDependencies,
          asyncDependencies,
        ) as ContainerWithNewAsyncDep<TName, TClass>
      }
    },

    registerValue<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: TDependency,
    ): ContainerWithNewSyncDep<TName, TDependency> {
      if (name in syncDependencies) {
        return __createContainer(
          {
            ...syncDependencies,
            [name]: () => dependency,
          },
          asyncDependencies,
        ) as ContainerWithNewSyncDep<TName, TDependency>
      } else {
        ;(syncDependencies as Record<TName, unknown>)[name] = () => dependency
        return __createContainer(
          syncDependencies,
          asyncDependencies,
        ) as ContainerWithNewSyncDep<TName, TDependency>
      }
    },

    resolve<TName extends keyof TSyncDependencies>(
      name: TName,
    ): TSyncDependencies[TName] {
      return (
        syncDependencies[
          name as keyof TSyncDependencyFactories
        ] as SyncDependencyFactory<TSyncDependencies[TName], typeof this>
      )(this)
    },

    async resolveAsync<TName extends keyof TAsyncDependencies>(
      name: TName,
    ): Promise<TAsyncDependencies[TName]> {
      return await (
        asyncDependencies[
          name as keyof TAsyncDependencyFactories
        ] as AsyncDependencyFactory<TAsyncDependencies[TName], typeof this>
      )(this)
    },

    resolveGroup<GroupName extends string>(
      groupName: GroupName,
    ): keyof TSyncDependencies extends ContainerKey
      ? ExtractPrefixedValues<GroupName, TSyncDependencies>[]
      : never {
      return (
        Object.entries(syncDependencies)
          .filter(([key]) => {
            return key.startsWith(`${groupName}:`)
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(([_key, value]) => {
            return value(this)
          }) as keyof TSyncDependencies extends ContainerKey
          ? ExtractPrefixedValues<GroupName, TSyncDependencies>[]
          : never
      )
    },

    async resolveGroupAsync<GroupName extends string>(
      groupName: GroupName,
    ): Promise<
      keyof TAsyncDependencies extends ContainerKey
        ? ExtractPrefixedValues<GroupName, TAsyncDependencies>[]
        : never
    > {
      return (await Promise.all(
        Object.entries(asyncDependencies)
          .filter(([key]) => {
            return key.startsWith(`${groupName}:`)
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(([_key, value]) => {
            return value(this)
          }),
      )) as keyof TAsyncDependencies extends ContainerKey
        ? ExtractPrefixedValues<GroupName, TAsyncDependencies>[]
        : never
    },
  }
}

/* eslint-disable @typescript-eslint/ban-types */

export type ContainerKey = string | symbol
type ConstrainedKey = Exclude<ContainerKey, '$' | `$:${string}`>

type ExtractPrefix<S extends ContainerKey> =
  S extends `${infer Prefix}:${string}` ? Prefix : never

type ExtractPrefixedValues<
  Prefix extends string,
  Struct extends Record<ContainerKey, unknown>,
  BaseKeys extends keyof Struct = keyof Struct,
> = BaseKeys extends `${Prefix}:${infer U}` ? Struct[`${Prefix}:${U}`] : never

type KeysMatching<Collection, Value> = {
  [K in keyof Collection]-?: Collection[K] extends Value ? K : never
}[keyof Collection]

type ContextualParamsToSyncResolverKeys<
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
  TParams extends
    | (
        | TSyncDependencies[keyof TSyncDependencies]
        | ReadableSyncContainer<Partial<TSyncDependencies>>
        | ReadableAsyncContainer<Partial<TAsyncDependencies>>
        | ReadableContainer<
            Partial<TSyncDependencies>,
            Partial<TAsyncDependencies>
          >
      )[]
    | [],
> = {
  [K in keyof TParams]: TParams[K] extends
    | ReadableSyncContainer<Partial<TSyncDependencies>>
    | ReadableAsyncContainer<Partial<TAsyncDependencies>>
    ? '$'
    : KeysMatching<TSyncDependencies, TParams[K]>
}

type ContextualParamsToAsyncResolverKeys<
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
  TParams extends
    | (
        | TSyncDependencies[keyof TSyncDependencies]
        | TAsyncDependencies[keyof TAsyncDependencies]
        | ReadableSyncContainer<Partial<TSyncDependencies>>
        | ReadableAsyncContainer<Partial<TAsyncDependencies>>
        | ReadableContainer<
            Partial<TSyncDependencies>,
            Partial<TAsyncDependencies>
          >
      )[]
    | [],
> = {
  [K in keyof TParams]: TParams[K] extends
    | ReadableSyncContainer<Partial<TSyncDependencies>>
    | ReadableAsyncContainer<Partial<TAsyncDependencies>>
    ? '$'
    :
        | KeysMatching<TSyncDependencies, TParams[K]>
        | KeysMatching<TAsyncDependencies, TParams[K]>
}

export interface SyncDependencyFactory<
  T,
  TContainer extends ReadableSyncContainer<Record<ConstrainedKey, unknown>>,
> {
  (container: TContainer): Awaited<T>
}

export interface AsyncDependencyFactory<
  T,
  TContainer extends ReadableContainer<
    Record<ConstrainedKey, unknown>,
    Record<ConstrainedKey, unknown>
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
    Record<ConstrainedKey, unknown>,
    Record<ConstrainedKey, unknown>
  >,
> extends SyncDependencyFactory<T, TContainer>,
    AsyncDependencyFactory<T, TContainer> {}

export interface ReadableSyncContainer<
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
> {
  /**
   * Resolve a "synchronous" dependency from the container.
   *
   * @param name The "name" of the dependency (can be a symbol).
   */
  resolve(name: '$'): this
  resolve<TName extends keyof TSyncDependencies>(
    name: TName,
  ): TSyncDependencies[TName]
}

export interface ReadableAsyncContainer<
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
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
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
> extends ReadableSyncContainer<TSyncDependencies>,
    ReadableAsyncContainer<TAsyncDependencies> {}

export interface ReadableGroupContainer<
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
> {
  resolveGroup<
    GroupName extends keyof TSyncDependencies extends ConstrainedKey
      ? ExtractPrefix<keyof TSyncDependencies>
      : never,
  >(
    groupName: GroupName,
  ): keyof TSyncDependencies extends ConstrainedKey
    ? ExtractPrefixedValues<GroupName, TSyncDependencies>[]
    : never

  resolveGroupAsync<
    GroupName extends keyof TAsyncDependencies extends ConstrainedKey
      ? ExtractPrefix<keyof TAsyncDependencies>
      : never,
  >(
    groupName: GroupName,
  ): Promise<
    keyof TAsyncDependencies extends ConstrainedKey
      ? ExtractPrefixedValues<GroupName, TAsyncDependencies>[]
      : never
  >
}

/**
 * Represents a write-only version of a type-safe IoC container with
 * "auto-wired" dependencies resolution.
 */
export interface WritableContainer<
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
> {
  /**
   * Registers a new synchronous dependency factory.
   * It cannot be used when self-resolution is needed. Use
   * `registerConstructor` instead.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency A dependency factory.
   */
  register<
    TName extends ConstrainedKey,
    TDependency extends TName extends keyof TSyncDependencies
      ? TSyncDependencies[TName]
      : TName extends '$' | keyof TAsyncDependencies
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
   * Registers a new asynchronous dependency factory.
   * It cannot be used when self-resolution is needed. Use
   * `registerAsyncConstructor` instead.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency A dependency factory.
   */
  registerAsync<
    TName extends ConstrainedKey,
    TDependency extends TName extends '$' | keyof TSyncDependencies
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

  registerConstructor<
    TName extends ConstrainedKey,
    TParams extends (
      | TSyncDependencies[keyof TSyncDependencies]
      | ReadableSyncContainer<Partial<TSyncDependencies>>
      | ReadableAsyncContainer<Partial<TAsyncDependencies>>
      | ReadableContainer<
          Partial<TSyncDependencies>,
          Partial<TAsyncDependencies>
        >
    )[],
    TClass extends TName extends '$' | keyof TAsyncDependencies
      ? never
      : TName extends keyof TSyncDependencies
      ? TSyncDependencies[TName]
      : unknown,
    TDependencies extends ContextualParamsToSyncResolverKeys<
      TSyncDependencies,
      TAsyncDependencies,
      TParams
    >,
  >(
    name: TName,
    constructor: new (...args: TParams) => TClass,
    ...args: TDependencies
  ): Container<
    {
      [TK in
        | keyof TSyncDependencies
        | TName]: TK extends keyof TSyncDependencies
        ? TName extends TK
          ? TClass
          : TSyncDependencies[TK]
        : TClass
    },
    TAsyncDependencies
  >

  /**
   * Registers a new constructor that might have asynchronous-resolvable
   * dependencies. This method is helpful when the constructor combinator is
   * not powerful enough (as it's only able to resolve synchronously, and it
   * cannot take advantage of self-resolution either).
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param constructor A class constructor, that will be use to resolve the
   *                    registered dependency.
   * @param args A list of dependency names that will be passed to the
   *             registered constructor at construction time, when we try to
   *             resolve the dependency.
   */
  registerAsyncConstructor<
    TName extends ConstrainedKey,
    TParams extends (
      | TSyncDependencies[keyof TSyncDependencies]
      | TAsyncDependencies[keyof TAsyncDependencies]
      | ReadableSyncContainer<Partial<TSyncDependencies>>
      | ReadableAsyncContainer<Partial<TAsyncDependencies>>
      | ReadableContainer<
          Partial<TSyncDependencies>,
          Partial<TAsyncDependencies>
        >
    )[],
    TClass extends TName extends '$' | keyof TSyncDependencies
      ? never
      : TName extends keyof TAsyncDependencies
      ? TAsyncDependencies[TName]
      : unknown,
    TDependencies extends ContextualParamsToAsyncResolverKeys<
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
   * Registers an already instantiated dependency.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency An already instantiated value.
   */
  registerValue<
    TName extends ConstrainedKey,
    TDependency extends TName extends keyof TSyncDependencies
      ? TSyncDependencies[TName]
      : TName extends '$' | keyof TAsyncDependencies
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
  TSyncDependencies extends Record<ConstrainedKey, unknown>,
  TAsyncDependencies extends Record<ConstrainedKey, unknown>,
> extends ReadableContainer<TSyncDependencies, TAsyncDependencies>,
    ReadableGroupContainer<TSyncDependencies, TAsyncDependencies>,
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
    ConstrainedKey,
    SyncDependencyFactory<
      unknown,
      Container<Record<ConstrainedKey, unknown>, {}>
    >
  >,
> = {} extends TDependencyFactories
  ? {}
  : {
      [name in keyof TDependencyFactories]: TDependencyFactories[name] extends SyncDependencyFactory<
        infer T,
        Container<Record<ConstrainedKey, unknown>, {}>
      >
        ? T
        : never
    }

type AsyncFactoriesToValues<
  TDependencyFactories extends Record<
    ConstrainedKey,
    AsyncDependencyFactory<
      unknown,
      Container<
        Record<ConstrainedKey, unknown>,
        Record<ConstrainedKey, unknown>
      >
    >
  >,
> = {} extends TDependencyFactories
  ? {}
  : {
      [name in keyof TDependencyFactories]: TDependencyFactories[name] extends AsyncDependencyFactory<
        infer T,
        Container<
          Record<ConstrainedKey, unknown>,
          Record<ConstrainedKey, unknown>
        >
      >
        ? Awaited<T>
        : never
    }

// -----------------------------------------------------------------------------
// Private Functions
// -----------------------------------------------------------------------------
function __createContainer<
  TSyncDependencyFactories extends Record<
    ConstrainedKey,
    SyncDependencyFactory<
      unknown,
      Container<
        Record<ConstrainedKey, unknown>,
        Record<ConstrainedKey, unknown>
      >
    >
  >,
  TAsyncDependencyFactories extends Record<
    ConstrainedKey,
    AsyncDependencyFactory<
      unknown,
      Container<
        Record<ConstrainedKey, unknown>,
        Record<ConstrainedKey, unknown>
      >
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
    TName extends ConstrainedKey,
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
    TName extends ConstrainedKey,
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
    register<TName extends ConstrainedKey, TDependency>(
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

    registerAsync<TName extends ConstrainedKey, TDependency>(
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

    registerConstructor<
      TName extends ConstrainedKey,
      TParams extends (
        | TSyncDependencies[keyof TSyncDependencies]
        | ReadableSyncContainer<Partial<TSyncDependencies>>
        | ReadableAsyncContainer<Partial<TAsyncDependencies>>
        | ReadableContainer<
            Partial<TSyncDependencies>,
            Partial<TAsyncDependencies>
          >
      )[],
      TClass extends TName extends '$' | keyof TAsyncDependencies
        ? never
        : TName extends keyof TSyncDependencies
        ? TSyncDependencies[TName]
        : unknown,
      TDependencies extends ContextualParamsToSyncResolverKeys<
        TSyncDependencies,
        TAsyncDependencies,
        TParams
      >,
    >(
      name: TName,
      constructor: new (...args: TParams) => TClass,
      ...args: TDependencies
    ): ContainerWithNewSyncDep<TName, TClass> {
      const factory = (container: typeof this) => {
        const resolvedParams = args.map((arg) => {
          return arg === '$'
            ? this
            : container.resolve(arg as keyof TSyncDependencies)
        }) as unknown as TParams

        return new constructor(...resolvedParams)
      }

      if (name in syncDependencies) {
        return __createContainer(
          {
            ...syncDependencies,
            [name]: factory,
          },
          asyncDependencies,
        ) as ContainerWithNewSyncDep<TName, TClass>
      } else {
        ;(syncDependencies as Record<TName, unknown>)[name] = factory
        return __createContainer(
          syncDependencies,
          asyncDependencies,
        ) as ContainerWithNewSyncDep<TName, TClass>
      }
    },

    registerAsyncConstructor<
      TName extends ConstrainedKey,
      TParams extends (
        | TSyncDependencies[keyof TSyncDependencies]
        | TAsyncDependencies[keyof TAsyncDependencies]
        | ReadableSyncContainer<Partial<TSyncDependencies>>
        | ReadableAsyncContainer<Partial<TAsyncDependencies>>
        | ReadableContainer<
            Partial<TSyncDependencies>,
            Partial<TAsyncDependencies>
          >
      )[],
      TClass extends TName extends '$' | keyof TSyncDependencies
        ? never
        : TName extends keyof TAsyncDependencies
        ? TAsyncDependencies[TName]
        : unknown,
      TDependencies extends ContextualParamsToAsyncResolverKeys<
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
          return arg === '$'
            ? this
            : (arg as string) in syncDependencies
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

    registerValue<TName extends ConstrainedKey, TDependency>(
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

    resolve<TName extends '$' | keyof TSyncDependencies>(
      name: TName,
    ): TSyncDependencies[TName] {
      // We have to cast `this` because there's no easy way to "translate" the
      // function overload that we have in the interface declaration to this
      // function definition.
      return name === '$'
        ? (this as TSyncDependencies[TName])
        : (
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
    ): keyof TSyncDependencies extends ConstrainedKey
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
          }) as keyof TSyncDependencies extends ConstrainedKey
          ? ExtractPrefixedValues<GroupName, TSyncDependencies>[]
          : never
      )
    },

    async resolveGroupAsync<GroupName extends string>(
      groupName: GroupName,
    ): Promise<
      keyof TAsyncDependencies extends ConstrainedKey
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
      )) as keyof TAsyncDependencies extends ConstrainedKey
        ? ExtractPrefixedValues<GroupName, TAsyncDependencies>[]
        : never
    },
  }
}

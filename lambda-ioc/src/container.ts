/* eslint-disable @typescript-eslint/ban-types */

export type ContainerKey = string | symbol

/**
 * Represents a dependency factory: a function that, given an IoC container, it
 * is able to instantiate a specific dependency.
 */

export interface SyncDependencyFactory<
  T,
  TContainer extends ReadableContainer<Record<ContainerKey, unknown>, {}>,
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
  // It might seem counterintuitive that we allow T as return type, but the
  // factory might also "become async" because of its dependencies, not just
  // because of its return type.
  (container: TContainer): Promise<T>
}

export interface DependencyFactory<
  T,
  TContainer extends ReadableContainer<
    Record<ContainerKey, unknown>,
    Record<ContainerKey, unknown>
  >,
> extends SyncDependencyFactory<T, TContainer>,
    AsyncDependencyFactory<T, TContainer> {}

/**
 * Represents a read-only version of a type-safe IoC container with "auto-wired"
 * dependencies resolution.
 */
export interface ReadableContainer<
  TSyncDependencies extends Record<ContainerKey, unknown>,
  TAsyncDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Resolve a "synchronous" dependency from the container.
   *
   * @param name The "name" of the dependency (can be a symbol).
   */
  resolve<TName extends keyof TSyncDependencies>(
    name: TName,
  ): TSyncDependencies[TName]

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
      ReadableContainer<TSyncDependencies, {}>
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
   * Register an already instantiated dependency.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency An already instantiated value.
   */
  registerValue<TName extends ContainerKey, TDependency>(
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
      return __createContainer(
        {
          ...syncDependencies,
          [name]: dependency,
        },
        asyncDependencies,
      ) as ContainerWithNewSyncDep<TName, TDependency>
    },

    registerAsync<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: AsyncDependencyFactory<
        TDependency,
        Container<TSyncDependencies, TAsyncDependencies>
      >,
    ): ContainerWithNewAsyncDep<TName, TDependency> {
      return __createContainer(syncDependencies, {
        ...asyncDependencies,
        [name]: dependency,
      }) as ContainerWithNewAsyncDep<TName, TDependency>
    },

    registerValue<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: TDependency,
    ): ContainerWithNewSyncDep<TName, TDependency> {
      return __createContainer(
        {
          ...syncDependencies,
          [name]: () => dependency,
        },
        asyncDependencies,
      ) as ContainerWithNewSyncDep<TName, TDependency>
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
  }
}

/* eslint-disable @typescript-eslint/ban-types */

export type ContainerKey = string | symbol

/**
 * Represents a dependency factory: a function that, given an IoC container, it
 * is able to instantiate a specific dependency.
 */
export type DependencyFactory<
  T,
  TContainer extends ReadableContainer<Record<ContainerKey, unknown>>,
> = (container: TContainer) => T | Promise<T>

/**
 * Represents a read-only version of a type-safe IoC container with "auto-wired"
 * dependencies resolution.
 */
export interface ReadableContainer<
  TDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Resolve a dependency from the container.
   *
   * @param name The "name" of the dependency (can be a symbol).
   */
  resolve<TName extends keyof TDependencies>(
    name: TName,
  ): Promise<TDependencies[TName]>
}

/**
 * Represents a write-only version of a type-safe IoC container with
 * "auto-wired" dependencies resolution.
 */
export interface WritableContainer<
  TDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Register a new dependency factory.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency A dependency factory.
   */
  register<TName extends ContainerKey, TDependency>(
    name: TName,
    dependency: DependencyFactory<
      TDependency,
      ReadableContainer<TDependencies>
    >,
  ): Container<{
    [TK in keyof TDependencies | TName]: TK extends keyof TDependencies
      ? TName extends TK
        ? TDependency
        : TDependencies[TK]
      : TDependency
  }>

  /**
   * Register an already instantiated dependency.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency An already instantiated value.
   */
  registerValue<TName extends ContainerKey, TDependency>(
    name: TName,
    dependency: TDependency,
  ): Container<{
    [TK in keyof TDependencies | TName]: TK extends keyof TDependencies
      ? TName extends TK
        ? TDependency
        : TDependencies[TK]
      : TDependency
  }>
}

/**
 * Represents a type-safe IoC container with "auto-wired" dependencies
 * resolution
 */
export interface Container<TDependencies extends Record<ContainerKey, unknown>>
  extends ReadableContainer<TDependencies>,
    WritableContainer<TDependencies> {}

/**
 * Creates a new type-safe IoC container.
 */
export function createContainer(): Container<{}> {
  return __createContainer({})
}

// -----------------------------------------------------------------------------
// Private Types
// -----------------------------------------------------------------------------
type FactoriesToValues<
  TDependencyFactories extends Record<
    ContainerKey,
    DependencyFactory<unknown, Container<Record<ContainerKey, unknown>>>
  >,
> = {} extends TDependencyFactories
  ? {}
  : {
      [name in keyof TDependencyFactories]: TDependencyFactories[name] extends DependencyFactory<
        infer T,
        Container<Record<ContainerKey, unknown>>
      >
        ? Awaited<T>
        : never
    }

// -----------------------------------------------------------------------------
// Private Functions
// -----------------------------------------------------------------------------
function __createContainer<
  TDependencyFactories extends Record<
    ContainerKey,
    DependencyFactory<unknown, Container<Record<ContainerKey, unknown>>>
  >,
>(
  dependencies: TDependencyFactories,
): Container<FactoriesToValues<TDependencyFactories>> {
  // These are "local" types, useful for the type inference
  type TDependencies = FactoriesToValues<TDependencyFactories>
  type NewContainerType<TName extends ContainerKey, TDependency> = Container<{
    [TK in keyof TDependencies | TName]: TK extends keyof TDependencies
      ? TName extends TK
        ? TDependency
        : TDependencies[TK]
      : TDependency
  }>

  return {
    register<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: DependencyFactory<TDependency, Container<TDependencies>>,
    ): NewContainerType<TName, TDependency> {
      return __createContainer({
        ...dependencies,
        [name]: dependency,
      }) as NewContainerType<TName, TDependency>
    },

    registerValue<TName extends ContainerKey, TDependency>(
      name: TName,
      dependency: TDependency,
    ): NewContainerType<TName, TDependency> {
      return __createContainer({
        ...dependencies,
        [name]: () => dependency,
      }) as NewContainerType<TName, TDependency>
    },

    async resolve<TName extends keyof TDependencies>(
      name: TName,
    ): Promise<TDependencies[TName]> {
      return await (
        dependencies[name as keyof TDependencyFactories] as DependencyFactory<
          TDependencies[TName],
          typeof this
        >
      )(this)
    },
  }
}

/* eslint-disable @typescript-eslint/ban-types */

export type ContainerKey = string | symbol

/**
 *
 */
export type DependencyFactory<
  T,
  TContainer extends Container<Record<ContainerKey, unknown>>,
> = (container: TContainer) => T | Promise<T>

/**
 *
 */
export interface Container<
  TDependencies extends Record<ContainerKey, unknown>,
> {
  /**
   * Register a new dependency.
   *
   * @param name The "name" of the dependency (can be a symbol).
   * @param dependency A dependency factory.
   */
  register<TName extends ContainerKey, TDependency>(
    name: TName,
    dependency: DependencyFactory<TDependency, Container<TDependencies>>,
  ): Container<{
    [TK in keyof TDependencies | TName]: TK extends keyof TDependencies
      ? TName extends TK
        ? TDependency
        : TDependencies[TK]
      : TDependency
  }>

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
 *
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

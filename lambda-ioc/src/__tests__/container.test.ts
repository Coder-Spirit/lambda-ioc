/* eslint-disable @typescript-eslint/ban-types */
import { Container, ReadableSyncContainer, createContainer } from '..'

// Behavioural tests
describe('container', () => {
  it('resolves itself with $ as key', () => {
    const container = createContainer()
    const resolvedContainer = container.resolve('$')
    expect(resolvedContainer).toBe(container)
  })

  it('can do indirect self-resolution for registerConstructor', () => {
    class DependsOnContainer {
      public readonly theAnswer: number

      // We inject the container itself instead of the "final" resolved value.
      // Here it makes no sense, but it can be useful when we need to inject
      // factories.
      constructor(
        cc: ReadableSyncContainer<{
          theAnswerToEverything: number
        }>,
      ) {
        this.theAnswer = cc.resolve('theAnswerToEverything')
      }
    }

    const container = createContainer()
      .registerValue('theAnswerToEverything', 42)
      .registerConstructor('C', DependsOnContainer, '$')
      // This 2n part is to check for a type-related regression that appears
      // when the container has more dependencies that the needed ones.
      .registerValue('anotherOne', 25)
      .registerConstructor('C2', DependsOnContainer, '$')

    const dependsOnContainer = container.resolve('C')
    expect(dependsOnContainer.theAnswer).toBe(42)

    const dependsOnContainer2 = container.resolve('C2')
    expect(dependsOnContainer2.theAnswer).toBe(42)
  })

  it('can do indirect self-resolution for registerAsyncConstructor', async () => {
    class DependsOnContainer {
      public readonly theAnswer: number

      // We inject the container itself instead of the "final" resolved value.
      // Here it makes no sense, but it can be useful when we need to inject
      // factories.
      constructor(
        public readonly cc: ReadableSyncContainer<{
          theAnswerToEverything: number
        }>,
      ) {
        this.theAnswer = cc.resolve('theAnswerToEverything')
      }
    }

    const container = createContainer()
      .registerValue('theAnswerToEverything', 42)
      .registerAsyncConstructor('C', DependsOnContainer, '$')
      // This 2n part is to check for a type-related regression that appears
      // when the container has more dependencies that the needed ones.
      .registerValue('anotherOne', 25)
      .registerAsyncConstructor('C2', DependsOnContainer, '$')

    const dependsOnContainer = await container.resolveAsync('C')
    expect(dependsOnContainer.theAnswer).toBe(42)

    const dependsOnContainer2 = await container.resolveAsync('C2')
    expect(dependsOnContainer2.theAnswer).toBe(42)
  })

  it('can register simple values', () => {
    const container = createContainer()
      .registerValue('foo', 'bar')
      .registerValue('theanswer', 42)

    expect(container.resolve('foo')).toBe('bar')
    expect(container.resolve('theanswer')).toBe(42)
  })

  it('can register simple factories', () => {
    const container = createContainer()
      .register('foo', () => 'bar')
      .register('theanswer', () => 42)

    expect(container.resolve('foo')).toBe('bar')
    expect(container.resolve('theanswer')).toBe(42)
  })

  it('can register async factories', async () => {
    const container = createContainer()
      .registerAsync('foo', async () => Promise.resolve('bar'))
      .registerAsync('theanswer', async () => Promise.resolve(42))

    expect(await container.resolveAsync('foo')).toBe('bar')
    expect(await container.resolveAsync('theanswer')).toBe(42)
  })

  it('can register async factories depending on sync & async dependencies', async () => {
    const container = createContainer()
      .register('a', () => 3)
      .registerAsync('b', async () => await Promise.resolve(5))
      .registerAsync(
        'ab',
        // In real life we would use a helper/combinator to avoid writing this
        // kind of ugly code
        async (c) => c.resolve('a') * (await c.resolveAsync('b')),
      )

    expect(await container.resolveAsync('ab')).toBe(15)
  })

  it('can re-register sync dependencies (without changing the "original" container)', async () => {
    const c1 = createContainer()
      .register('a', () => 3)
      .register('b', () => 5)
      .registerAsync('c', async () => await Promise.resolve(11))
      .register('ab', (c) => c.resolve('a') * c.resolve('b'))
      .registerAsync(
        'ac',
        async (c) => c.resolve('a') * (await c.resolveAsync('c')),
      )
    const c2 = c1.register('a', () => 7)
    const c3 = c2.registerValue('a', 13)

    expect(c1.resolve('ab')).toBe(15)
    expect(c2.resolve('ab')).toBe(35)
    expect(c3.resolve('ab')).toBe(65)

    expect(await c1.resolveAsync('ac')).toBe(33)
    expect(await c2.resolveAsync('ac')).toBe(77)
    expect(await c3.resolveAsync('ac')).toBe(143)
  })

  it('can re-register async dependencies (without changing the "original" container)', async () => {
    const c1 = createContainer()
      .register('a', () => 3)
      .registerAsync('b', async () => await Promise.resolve(5))
      .registerAsync(
        'ab',
        async (c) => c.resolve('a') * (await c.resolveAsync('b')),
      )
    const c2 = c1.registerAsync('b', async () => await Promise.resolve(7))

    expect(await c1.resolveAsync('ab')).toBe(15)
    expect(await c2.resolveAsync('ab')).toBe(21)
  })

  it('can register groups by relying on prefixes', () => {
    const container = createContainer()
      .register('a', () => 10)
      .register('b', () => 20)
      .register('g1:a', () => 30)
      .register('g1:b', () => 40)
      .register('g2:a', () => 50)
      .register('g2:b', () => 60)

    const g1 = container.resolveGroup('g1')
    expect(g1).toHaveLength(2)
    expect(g1).toContain(30)
    expect(g1).toContain(40)

    const g2 = container.resolveGroup('g2')
    expect(g2).toHaveLength(2)
    expect(g2).toContain(50)
    expect(g2).toContain(60)
  })

  it('can register asynchronous groups by relying on prefixes', async () => {
    const container = createContainer()
      .register('a', () => 10)
      .register('b', () => 20)
      .registerAsync('g1:a', () => Promise.resolve(30))
      .registerAsync('g1:b', () => Promise.resolve(40))
      .registerAsync('g2:a', () => Promise.resolve(50))
      .registerAsync('g2:b', () => Promise.resolve(60))

    const g1 = await container.resolveGroupAsync('g1')
    expect(g1).toHaveLength(2)
    expect(g1).toContain(30)
    expect(g1).toContain(40)

    const g2 = await container.resolveGroupAsync('g2')
    expect(g2).toHaveLength(2)
    expect(g2).toContain(50)
    expect(g2).toContain(60)
  })

  it('can register constructors without having to rely on combinators', () => {
    class C {
      constructor(public readonly a: number, public readonly b: string) {}
    }

    const container = createContainer()
      .registerValue('numeric', 10)
      .registerValue('text', 'hello')
      .registerConstructor('C', C, 'numeric', 'text')

    const c1 = container.resolve('C')
    expect(c1.a).toBe(10)
    expect(c1.b).toBe('hello')

    // Re-registering a new dependency with the same name should work, as long
    // as we preserve its type.
    const secondContainer = container
      .registerValue('float', 34.5)
      .registerValue('name', 'Bob')
      .registerConstructor('C', C, 'float', 'name')

    const c2 = secondContainer.resolve('C')
    expect(c2.a).toBe(34.5)
    expect(c2.b).toBe('Bob')
  })

  it('can register constructors with a mix of sync & async dependencies', async () => {
    class C {
      constructor(public readonly a: number, public readonly b: string) {}
    }

    const container = createContainer()
      .registerValue('numeric', 10)
      .registerAsync('text', () => Promise.resolve('hello'))
      .registerAsyncConstructor('C', C, 'numeric', 'text')

    const c1 = await container.resolveAsync('C')
    expect(c1.a).toBe(10)
    expect(c1.b).toBe('hello')

    // Re-registering a new dependency with the same name should work, as long
    // as we preserve its type.
    const secondContainer = container
      .registerAsync('float', () => Promise.resolve(34.5))
      .registerValue('name', 'Bob')
      .registerAsyncConstructor('C', C, 'float', 'name')

    const c2 = await secondContainer.resolveAsync('C')
    expect(c2.a).toBe(34.5)
    expect(c2.b).toBe('Bob')
  })
})

// Type tests
describe('@types/container', () => {
  it('has the correct type when created for the first time', () => {
    const c = createContainer()
    type C = typeof c
    type C_extends_Container = C extends Container<{}, {}> ? true : false
    type Container_extends_C = Container<{}, {}> extends C ? true : false
    type C_is_Container = C_extends_Container extends true
      ? Container_extends_C extends true
        ? true
        : false
      : false
    const c_is_Container: C_is_Container = true
    expect(c_is_Container).toBe(true)
  })

  it('has the correct type after register call', () => {
    const c = createContainer().register('a', () => 1)

    type C = typeof c
    type TargetType = Container<{ a: number }, {}>

    type C_extends_TargetType = C extends TargetType ? true : false
    type TargetType_extends_C = TargetType extends C ? true : false
    type C_is_TargetType = C_extends_TargetType extends true
      ? TargetType_extends_C extends true
        ? true
        : false
      : false
    const c_is_TargetType: C_is_TargetType = true
    expect(c_is_TargetType).toBe(true)
  })

  it('has the correct type after registerAsync call', () => {
    const c = createContainer().registerAsync(
      'b',
      async () => await Promise.resolve(1),
    )

    type C = typeof c
    type TargetType = Container<{}, { b: number }>

    type C_extends_TargetType = C extends TargetType ? true : false
    type TargetType_extends_C = TargetType extends C ? true : false
    type C_is_TargetType = C_extends_TargetType extends true
      ? TargetType_extends_C extends true
        ? true
        : false
      : false
    const c_is_TargetType: C_is_TargetType = true
    expect(c_is_TargetType).toBe(true)
  })

  it('resolves nothing when the container is empty', () => {
    type C = Container<{}, {}>

    // Checking what can be synchronously resolved (it should be nothing)
    type C_resolve_Parameters = Parameters<C['resolve']>
    type C_resolve_Parameters_is_never = C_resolve_Parameters extends [never]
      ? true
      : false
    const c_cannot_resolve_anything: C_resolve_Parameters_is_never = true
    expect(c_cannot_resolve_anything).toBe(true)

    // Checking what can be asynchronously resolved (it should be nothing)
    type C_resolveAsync_Parameters = Parameters<C['resolveAsync']>
    type C_resolveAsync_Parameters_is_never =
      C_resolveAsync_Parameters extends [never] ? true : false
    const c_cannot_resolveAsync_anything: C_resolveAsync_Parameters_is_never =
      true
    expect(c_cannot_resolveAsync_anything).toBe(true)
  })

  it('only resolves the sync registered dependency', () => {
    type C = Container<{ a: number }, {}>

    // Checking what can be synchronously resolved (it should be just 'a')
    type C_resolve_Parameters = Parameters<C['resolve']>
    type C_resolve_Parameters_is_a = C_resolve_Parameters extends ['a']
      ? true
      : false
    const c_can_only_resolve_a: C_resolve_Parameters_is_a = true
    expect(c_can_only_resolve_a).toBe(true)

    // Checking what can be asynchronously resolved (it should be nothing)
    type C_resolveAsync_Parameters = Parameters<C['resolveAsync']>
    type C_resolveAsync_Parameters_is_never =
      C_resolveAsync_Parameters extends [never] ? true : false
    const c_cannot_resolveAsync_anything: C_resolveAsync_Parameters_is_never =
      true
    expect(c_cannot_resolveAsync_anything).toBe(true)
  })

  it('assigns the correct type to sync resolved values', () => {
    type C = Container<{ a: number }, {}>

    // Checking the type for the resolved value
    type C_resolve_ReturnType = ReturnType<C['resolve']>
    type C_resolve_ReturnType_extends_number =
      C_resolve_ReturnType extends number ? true : false
    type C_number_extends_resolve_ReturnType =
      number extends C_resolve_ReturnType ? true : false
    type C_resolve_ReturnType_is_number =
      C_resolve_ReturnType_extends_number extends true
        ? C_number_extends_resolve_ReturnType extends true
          ? true
          : false
        : false

    const c_resolves_number: C_resolve_ReturnType_is_number = true
    expect(c_resolves_number).toBe(true)
  })

  it('only resolves the async registered dependency', () => {
    type C = Container<{}, { b: number }>

    // Checking what can be synchronously resolved (it should be nothing)
    type C_resolve_Parameters = Parameters<C['resolve']>
    type C_resolve_Parameters_is_never = C_resolve_Parameters extends [never]
      ? true
      : false
    const c_cannot_resolve_anything: C_resolve_Parameters_is_never = true
    expect(c_cannot_resolve_anything).toBe(true)

    // Checking what can be asynchronously resolved (it should be just 'b)
    type C_resolveAsync_Parameters = Parameters<C['resolveAsync']>
    type C_resolveAsync_Parameters_is_b = C_resolveAsync_Parameters extends [
      'b',
    ]
      ? true
      : false
    const c_can_only_resolve_b: C_resolveAsync_Parameters_is_b = true
    expect(c_can_only_resolve_b).toBe(true)
  })

  it('assigns the correct type to async resolved values', () => {
    type C = Container<{}, { a: number }>

    // Checking the type for the resolved value
    type C_resolveAsync_ReturnType = ReturnType<C['resolveAsync']>
    type C_resolveAsync_ReturnType_extends_number =
      C_resolveAsync_ReturnType extends Promise<number> ? true : false
    type C_number_extends_resolve_ReturnType =
      Promise<number> extends C_resolveAsync_ReturnType ? true : false
    type C_resolveAsync_ReturnType_is_number =
      C_resolveAsync_ReturnType_extends_number extends true
        ? C_number_extends_resolve_ReturnType extends true
          ? true
          : false
        : false

    const c_resolvesAsync_number: C_resolveAsync_ReturnType_is_number = true
    expect(c_resolvesAsync_number).toBe(true)
  })

  it('only resolves the sync registered groups', () => {
    type C = Container<
      {
        a: number
        b: number
        'g1:a': number
        'g1:b': string
        'g2:a': string
        'g2:b': boolean
      },
      {}
    >

    type C_resolveGroup_Parameters = Parameters<C['resolveGroup']>
    type C_resolveGroup_Parameters_extends_g1g2 =
      C_resolveGroup_Parameters extends ['g1' | 'g2'] ? true : false
    type g1g2_extends_C_resolveGroup_Parameters = [
      'g1' | 'g2',
    ] extends C_resolveGroup_Parameters
      ? true
      : false
    type C_resolveGroup_Parameters_is_g1g2 =
      C_resolveGroup_Parameters_extends_g1g2 extends true
        ? g1g2_extends_C_resolveGroup_Parameters extends true
          ? true
          : false
        : false
    const c_can_only_resolveGroup_g1g2: C_resolveGroup_Parameters_is_g1g2 = true
    expect(c_can_only_resolveGroup_g1g2).toBe(true)
  })

  it('only resolves the async registered groups', () => {
    type C = Container<
      {
        a: number
        b: number
      },
      {
        'g1:a': number
        'g1:b': string
        'g2:a': string
        'g2:b': boolean
      }
    >

    type C_resolveGroupAsync_Parameters = Parameters<C['resolveGroupAsync']>
    type C_resolveGroupAsync_Parameters_extends_g1g2 =
      C_resolveGroupAsync_Parameters extends ['g1' | 'g2'] ? true : false
    type g1g2_extends_C_resolveGroupAsync_Parameters = [
      'g1' | 'g2',
    ] extends C_resolveGroupAsync_Parameters
      ? true
      : false
    type C_resolveGroupAsync_Parameters_is_g1g2 =
      C_resolveGroupAsync_Parameters_extends_g1g2 extends true
        ? g1g2_extends_C_resolveGroupAsync_Parameters extends true
          ? true
          : false
        : false
    const c_can_only_resolveGroupAsync_g1g2: C_resolveGroupAsync_Parameters_is_g1g2 =
      true
    expect(c_can_only_resolveGroupAsync_g1g2).toBe(true)
  })

  it('has the correct type for self-resolution', () => {
    const c1 = createContainer()
    const c2 = c1.registerValue('a', 1)
    const rc1 = c1.resolve('$')
    const rc2 = c2.resolve('$')

    type C1 = typeof c1
    type C2 = typeof c2
    type RC1 = typeof rc1
    type RC2 = typeof rc2

    type C1_extends_RC1 = C1 extends RC1 ? true : false
    type RC1_extends_C1 = RC1 extends C1 ? true : false
    type C1_is_RC1 = C1_extends_RC1 extends true
      ? RC1_extends_C1 extends true
        ? true
        : false
      : false

    type C2_extends_RC2 = C2 extends RC2 ? true : false
    type RC2_extends_C2 = RC2 extends C2 ? true : false
    type C2_is_RC2 = C2_extends_RC2 extends true
      ? RC2_extends_C2 extends true
        ? true
        : false
      : false

    const c1_is_rc1: C1_is_RC1 = true
    const c2_is_rc2: C2_is_RC2 = true

    expect(c1_is_rc1).toBe(true)
    expect(c2_is_rc2).toBe(true)
  })
})

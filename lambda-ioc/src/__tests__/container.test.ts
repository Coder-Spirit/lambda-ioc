/* eslint-disable @typescript-eslint/ban-types */
import { Container, createContainer } from '..'

// Behavioural tests
describe('container', () => {
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

    expect(c1.resolve('ab')).toBe(15)
    expect(c2.resolve('ab')).toBe(35)

    expect(await c1.resolveAsync('ac')).toBe(33)
    expect(await c2.resolveAsync('ac')).toBe(77)
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
})

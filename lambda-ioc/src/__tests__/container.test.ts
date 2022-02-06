import { createContainer } from '..'

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

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
})

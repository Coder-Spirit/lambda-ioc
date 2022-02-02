import { createContainer } from '..'

describe('container', () => {
  it('can register simple values', async () => {
    const container = createContainer()
      .registerValue('foo', 'bar')
      .registerValue('theanswer', 42)

    expect(await container.resolve('foo')).toBe('bar')
    expect(await container.resolve('theanswer')).toBe(42)
  })

  it('can register simple factories', async () => {
    const container = createContainer()
      .register('foo', () => 'bar')
      .register('theanswer', () => 42)

    expect(await container.resolve('foo')).toBe('bar')
    expect(await container.resolve('theanswer')).toBe(42)
  })
})

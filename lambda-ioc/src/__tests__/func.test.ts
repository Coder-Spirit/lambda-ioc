import { createContainer, func } from '..'

describe('func', () => {
  it('can be registered without parameters', async () => {
    const container = createContainer().register(
      'foo',
      func(() => 'result'),
    )
    expect((await container.resolve('foo'))()).toBe('result')
  })

  it('can be registered with parameters', async () => {
    const container = createContainer()
      .registerValue('a', 3)
      .registerValue('b', 5)
      .register(
        'f',
        func((a: number, b: number) => a * b, 'a', 'b'),
      )

    expect((await container.resolve('f'))()).toBe(15)
  })

  it('resolves a new function each time', async () => {
    const container = createContainer().register(
      'foo',
      func(() => 'result'),
    )

    const f1 = await container.resolve('foo')
    const f2 = await container.resolve('foo')

    expect(f1()).toBe('result')
    expect(f2()).toBe('result')
    expect(f1).not.toBe(f2)
  })
})

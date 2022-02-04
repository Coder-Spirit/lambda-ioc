import { createContainer, func, singleton } from '..'

describe('singleton', () => {
  it('resolves the same instance each time (no dependencies)', () => {
    const container = createContainer().register(
      'foo',
      singleton(func(() => 'result')),
    )

    const f1 = container.resolve('foo')
    const f2 = container.resolve('foo')

    expect(f1()).toBe('result')
    expect(f2()).toBe('result')
    expect(f1).toBe(f2)
  })

  it('resolves the same instance each time (multiple dependencies)', () => {
    const container = createContainer()
      .registerValue('a', 3)
      .registerValue('b', 5)
      .register('f', singleton(func((a: number, b: number) => a * b, 'a', 'b')))

    const f1 = container.resolve('f')
    const f2 = container.resolve('f')

    expect(f1()).toBe(15)
    expect(f2()).toBe(15)
    expect(f1).toBe(f2)
  })
})

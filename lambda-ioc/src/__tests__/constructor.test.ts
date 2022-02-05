import { constructor, createContainer, singleton } from '..'

describe('constructor', () => {
  it('can be registered without parameters', () => {
    class A {}
    const container = createContainer().register('A', constructor(A))
    const a = container.resolve('A')
    expect(a).toBeInstanceOf(A)
  })

  it('can be registered with parameters', () => {
    class A {}
    class B {
      constructor(readonly a: A) {}
    }
    class C {
      constructor(readonly b: B) {}
    }

    const container = createContainer()
      .register('A', constructor(A))
      .register('B', constructor(B, 'A'))
      .register('C', singleton(constructor(C, 'B')))

    // We abuse a bit this test to verify other tangential properties, like
    // uniqueness of instances.
    const b1 = container.resolve('B')
    const b2 = container.resolve('B')

    expect(b1).toBeInstanceOf(B) // That's the real test.
    expect(b2).toBeInstanceOf(B)
    expect(b1).not.toBe(b2)

    const c1 = container.resolve('C')
    const c2 = container.resolve('C')

    expect(c1).toBeInstanceOf(C)
    expect(c2).toBeInstanceOf(C)
    expect(c1).toBe(c2)
  })
})

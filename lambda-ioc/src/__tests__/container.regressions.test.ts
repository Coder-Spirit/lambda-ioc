import { cc2ic } from '../combinators'
import { createContainer } from '..'

interface IA {
  f: () => string
}

class A implements IA {
  constructor(private readonly s: string) {}
  public f(): string {
    return this.s
  }
}

class B {
  constructor(private readonly a: IA) {}
  public g(): IA {
    return this.a
  }
}

describe('container regressions', () => {
  describe('registerConstructor', () => {
    it('allows to register constructors they are depended upon through interfaces', () => {
      const container = createContainer()
        .registerValue('greeting', 'hello')
        .registerConstructor('A', cc2ic<IA>()(A), 'greeting') // We have to rely on cc2ic
        .registerConstructor('B', B, 'A')

      expect(container.resolve('B').g().f()).toBe('hello')
    })
  })
})

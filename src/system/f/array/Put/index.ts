import { Functional } from '../../../../Class/Functional'
import { Done } from '../../../../Class/Functional/Done'
import { System } from '../../../../system'
import { ID_PUT } from '../../../_ids'

export interface I<T> {
  a: T[]
  v: T
  i: number
}

export interface O<T> {
  a: T[]
}

export default class Put<T> extends Functional<I<T>, O<T>> {
  constructor(system: System) {
    super(
      {
        i: ['a', 'v', 'i'],
        o: ['a'],
      },
      {},
      system,
      ID_PUT
    )
  }

  f({ a, v, i }: I<T>, done: Done<O<T>>): void {
    if (i < a.length) {
      const b = [...a]
      b[i] = v
      done({ a: b })
    } else {
      done(undefined, 'index out of boundary')
    }
  }
}

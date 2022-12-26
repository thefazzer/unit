import { Functional } from '../../../../../Class/Functional'
import { Done } from '../../../../../Class/Functional/Done'
import { System } from '../../../../../system'
import { ID_STROKE } from '../../../../_ids'

export interface I<T> {
  d: any[][]
}

export interface O<T> {
  d: any[][]
}

export default class Stroke<T> extends Functional<I<T>, O<T>> {
  constructor(system: System) {
    super(
      {
        i: ['d'],
        o: ['d'],
      },
      {},
      system,
      ID_STROKE
    )
  }

  f({ d }: I<T>, done: Done<O<T>>): void {
    done({
      d: [...d, ['stroke']],
    })
  }
}

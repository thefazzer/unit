import { Done } from '../../../Class/Functional/Done'
import { Semifunctional } from '../../../Class/Semifunctional'
import { System } from '../../../system'
import { S } from '../../../types/interface/S'
import { U } from '../../../types/interface/U'
import { ID_BOOT } from '../../_ids'

export interface I<T> {
  opt: U
  done: T
  parent: S
}

export interface O<T> {
  system: S
}

export default class Boot<T> extends Semifunctional<I<T>, O<T>> {
  constructor(system: System) {
    super(
      {
        fi: ['init', 'parent'],
        fo: ['system'],
        i: ['done'],
        o: [],
      },
      {
        input: {
          parent: {
            ref: true,
          },
        },
        output: {
          system: {
            ref: true,
          },
        },
      },
      system,
      ID_BOOT
    )
  }

  async f({ parent, opt }: I<T>, done: Done<O<T>>) {
    const [system, unlisten] = parent.newSystem(opt)

    done({
      system,
    })
  }

  onIterDataInputData(name: string) {
    // if (name === 'done') {
    this._forward_empty('system')

    this._backward('done')
    // }
  }
}

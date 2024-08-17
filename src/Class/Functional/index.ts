import { Primitive, PrimitiveEvents } from '../../Primitive'
import { System } from '../../system'
import forEachValueKey from '../../system/core/object/ForEachKeyValue/f'
import { Dict } from '../../types/Dict'
import { filterObj } from '../../util/object'
import { ION, Opt } from '../Unit'
import { Done } from './Done'

export type Functional_EE = {}

export type FunctionalEvents<_EE extends Dict<any[]>> = PrimitiveEvents<
  _EE & Functional_EE
> &
  Functional_EE

export type Functional_S = {
  _looping: boolean
}

export type FunctionalState<
  T extends Omit<Dict<any>, keyof Functional_S> = {},
> = T & Functional_S

export class Functional<
  I extends Dict<any> = {},
  O extends Dict<any> = {},
  _EE extends FunctionalEvents<_EE> = FunctionalEvents<Functional_EE>,
> extends Primitive<I, O, _EE> {
  private _looping: boolean = false

  constructor(
    { i, o }: ION<I, O> = {},
    opt: Opt = {},
    system: System,
    id: string
  ) {
    super({ i, o }, opt, system, id)

    this.addListener('take_err', () => {
      if (this._looping) {
        this._backward_if_ready()
      }
    })
    this.addListener('take_caught_err', () => {
      if (!this.hasErr()) {
        this._backward_if_ready()
      }
    })

    this.addListener('reset', this.d)
    this.addListener('destroy', this.d)
  }

  private _on_input_data<K extends keyof I>(name: K): void {
    if (this._i[name] !== undefined && this._i_active.size === this._i_count) {
      this._looping = false
    }

    this._forward_if_ready()
  }

  private _on_input_drop(): void {
    if (this._i_active.size === this._i_count - 1) {
      if (!this._backwarding && !this._forwarding_empty) {
        this._looping = false
        if (this._catchErr) {
          this.takeCaughtErr()
        } else {
          this.takeErr()
        }
        this.d()
        this._forward_all_empty()
      }
    }
  }

  private _on_input_invalid<K extends keyof I>(name: K): void {
    if (this._i_invalid.size === 1) {
      this.d()
      this._invalidate()
    }
  }

  onDataInputData<K extends keyof I>(name: K): void {
    this._on_input_data(name)
  }

  onDataInputDrop<K extends keyof I>(name: K, data: any): void {
    this._on_input_drop()
  }

  onDataInputStart<K extends keyof I>(name: K): void {
    if (this._i_start.size === this._i_count) {
      this._start()
    }
  }

  onDataInputInvalid<K extends keyof I>(name: K): void {
    this._on_input_invalid(name)
  }

  onDataInputEnd(name: string): void {
    if (this._i_start.size === this._i_count - 1) {
      this._end()
    }
  }

  onRefInputData(name: string): void {
    this._on_input_data(name)
  }

  onRefInputDrop<K extends keyof I>(name: K, data: any): void {
    this._on_input_drop()
  }

  onRefInputInvalid<K extends keyof I>(name: K): void {
    this._on_input_invalid(name)
  }

  private _on_data_output_drop = <K extends keyof O>(name: K): void => {
    this._backward_if_ready()
    this._forward_if_ready()
  }

  onDataOutputDrop<K extends keyof O>(name: K) {
    this._on_data_output_drop(name)
  }

  f(i: Partial<I>, done: Done<O>) {}

  d() {}

  private _backward_if_ready(): void {
    const {
      api: {
        window: { setTimeout },
      },
    } = this.__system

    if (
      !this._forwarding_empty &&
      !this._forwarding &&
      !this._err &&
      !this._caughtErr &&
      this._o_active.size === 0
    ) {
      this._looping = false

      this._backward_all()

      // without setTimeout an infinite loop will turn into a stack overflow
      // setTimeout(() => {
      this._forward_if_ready()
      // }, 0)

      // this.__system.tick(this._forward_if_ready.bind(this))
    }
  }

  private _signal: Symbol

  private _forward_if_ready() {
    // console.log('Functional', '_forward_if_ready')
    while (
      this._o_active.size - this._o_invalid.size === 0 &&
      this._i_active.size - this._i_invalid.size === this._i_count &&
      !this._forwarding &&
      !this._backwarding &&
      !this._looping // prevent async infinite while loop
    ) {
      this._looping = true

      if (this._err !== null) {
        this._forwarding_empty = true
        this.takeErr()
        this._forwarding_empty = false
      }

      this._signal = Symbol()

      const signal = this._signal

      this.f(this._i, (...args) => {
        if (signal !== this._signal) {
          return
        }

        this._done(...args)
      })
    }
  }

  public _done: Done<O> = (data, err = null) => {
    if (err) {
      this._forwarding = true
      this.err(err)
      this._forwarding = false
      this._forward_all_empty()
    } else {
      if (data !== undefined) {
        const output_empty = filterObj(this._output, (o) => o.empty())
        const output_not_empty = filterObj(this._output, (o) => !o.empty())

        const push_or_pull = (output, name) => {
          const o = data[name]
          if (o === undefined) {
            output.pull()
          } else {
            output.push(o)
          }
        }

        this._forwarding = true
        forEachValueKey(output_empty, push_or_pull)
        forEachValueKey(output_not_empty, push_or_pull)
        this._forwarding = false
      }
    }
    this._backward_if_ready()
  }

  public snapshotSelf(): any {
    return {
      ...super.snapshotSelf(),
      _looping: this._looping,
    }
  }

  public restoreSelf(state: Dict<any>): void {
    const { _looping, ...rest } = state

    super.restoreSelf(rest)

    this._looping = _looping
  }
}

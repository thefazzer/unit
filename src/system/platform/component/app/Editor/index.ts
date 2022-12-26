import { Element_ } from '../../../../../Class/Element'
import { Graph } from '../../../../../Class/Graph'
import { emptySpec, newSpecId } from '../../../../../client/spec'
import { Zoom } from '../../../../../client/zoom'
import { fromSpec } from '../../../../../spec/fromSpec'
import { System } from '../../../../../system'
import { Dict } from '../../../../../types/Dict'
import { G } from '../../../../../types/interface/G'
import { ID_EDITOR } from '../../../../_ids'

export interface I<T> {
  style: Dict<string>
  graph: G
  disabled: boolean
  fullwindow: boolean
  frame: Element_
  zoom: Zoom
}

export interface O<T> {
  graph: G
}

export default class Editor<T> extends Element_<I<T>, O<T>> {
  __ = ['U', 'C', 'V', 'J', 'G']

  private _fallback_graph: Graph

  private _graph: Graph

  constructor(system: System) {
    super(
      {
        i: ['graph', 'style', 'disabled', 'fullwindow', 'frame', 'zoom'],
        o: ['graph'],
      },
      {
        input: {
          graph: {
            ref: true,
          },
          frame: {
            ref: true,
          },
        },
        output: {
          graph: {
            ref: true,
          },
        },
      },
      system,
      ID_EDITOR
    )

    const { specs } = system

    const spec = emptySpec({ id: newSpecId(specs) })

    const Class = fromSpec(spec, specs, {})

    const fallback_graph = new Class(system)
    this._fallback_graph = fallback_graph

    this._input.graph.push(this._fallback_graph)
    this._output.graph.push(this._fallback_graph)

    this._fallback_graph.play()
  }

  onRefInputInvalid(name: string) {
    // console.log('Editor', 'onRefInputInvalid', name)

    if (name === 'graph') {
      //
    }
  }

  onRefInputData(name: string, data: any) {
    // console.log('Editor', 'onRefInputData', name, data)

    if (name === 'graph') {
      const graph = data as Graph

      this._graph = graph

      this._output.graph.push(graph)
    }
  }

  onRefInputDrop(name: string) {
    // console.log('Editor', 'onRefInputDrop', name)

    if (name === 'graph') {
      this._input.graph.push(this._fallback_graph)
      this._output.graph.push(this._fallback_graph)
    }
  }

  public onRefOutputData(name: string, data: any): void {
    // console.log('Editor', 'onRefOutputData', name, data)
  }

  public snapshotSelf(): Dict<any> {
    return {
      ...super.snapshotSelf(),
      // TODO
      _fallback_graph: null,
    }
  }

  public restoreSelf(state: Dict<any>): void {
    const { _fallback_graph, ...rest } = state

    super.restoreSelf(rest)

    // this._fallback_graph = _fallback_graph
  }
}

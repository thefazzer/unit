import { Dict } from '../../types/Dict'

export type Style = Dict<string>

export type Tag = {
  name: string
  style: Style
}

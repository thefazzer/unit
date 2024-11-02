import { Dict } from '../../types/Dict'
import { Component } from '../component'

export function mergePropStyle<T>(
  component: Component,
  style: Dict<string | undefined>
) {
  const current = component.getProp('style')

  component.setProp('style', { ...current, ...style })
}

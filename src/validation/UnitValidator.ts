

import { TreeNode, TreeNodeType, getTree, isTypeMatch } from '../spec/parser'
import { GraphSpec } from '../types/GraphSpec'
import { UnitBundleSpec } from '../types/UnitBundleSpec'
import { Specs } from '../types'
import { getSubgraphs } from '../spec/type'
import {
  ValidationError,
  ValidationErrorType,
  ValidationOptions,
  ValidationResult,
  Validator
} from './types'

export class UnitValidator implements Validator {
  constructor(private specs: Specs) {}

  private validateStructure(spec: UnitBundleSpec): ValidationError[] {
    const errors: ValidationError[] = []

    if (!spec.unit) {
      errors.push({
        type: ValidationErrorType.MISSING_FIELD,
        message: 'Missing required field: unit',
        path: ['unit']
      })
      return errors
    }

    if (!spec.unit.id) {
      errors.push({
        type: ValidationErrorType.MISSING_FIELD,
        message: 'Missing required field: unit.id',
        path: ['unit', 'id']
      })
    }

    // Validate input pins
    if (spec.unit.input) {
      Object.entries(spec.unit.input).forEach(([pinId, pin]) => {
        if (pin && typeof pin === 'object') {
          if (pin.constant && !pin.data) {
            errors.push({
              type: ValidationErrorType.INVALID_PIN,
              message: `Constant pin ${pinId} missing data`,
              path: ['unit', 'input', pinId]
            })
          }
        }
      })
    }

    // Validate output pins
    if (spec.unit.output) {
      Object.entries(spec.unit.output).forEach(([pinId, pin]) => {
        if (pin && typeof pin === 'object' && pin.constant) {
          errors.push({
            type: ValidationErrorType.INVALID_PIN,
            message: `Output pin ${pinId} cannot be constant`,
            path: ['unit', 'output', pinId]
          })
        }
      })
    }

    return errors
  }

  private validateTypes(spec: UnitBundleSpec): ValidationError[] {
    const errors: ValidationError[] = []
    const unitSpec = this.specs[spec.unit.id]

    if (!unitSpec) {
      errors.push({
        type: ValidationErrorType.INVALID_STRUCTURE,
        message: `Unit spec not found: ${spec.unit.id}`,
        path: ['unit', 'id']
      })
      return errors
    }

    // Validate input pin types
    if (spec.unit.input && unitSpec.inputs) {
      Object.entries(spec.unit.input).forEach(([pinId, pin]) => {
        const expectedType = unitSpec.inputs[pinId]?.type
        if (expectedType && pin.data) {
          const dataTree = getTree(pin.data)
          if (!isTypeMatch(this.specs, dataTree.value, expectedType)) {
            errors.push({
              type: ValidationErrorType.TYPE_MISMATCH,
              message: `Type mismatch for input pin ${pinId}`,
              path: ['unit', 'input', pinId],
              expected: expectedType,
              actual: dataTree.value,
              node: dataTree
            })
          }
        }
      })
    }

    return errors
  }

  private validateGraph(spec: GraphSpec): ValidationError[] {
    const errors: ValidationError[] = []

    // Check for circular dependencies
    const subgraphs = getSubgraphs(spec)
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const checkCycles = (unitId: string): boolean => {
      if (recursionStack.has(unitId)) {
        errors.push({
          type: ValidationErrorType.CIRCULAR_DEPENDENCY,
          message: `Circular dependency detected involving unit: ${unitId}`,
          path: ['units', unitId]
        })
        return true
      }

      if (visited.has(unitId)) {
        return false
      }

      visited.add(unitId)
      recursionStack.add(unitId)

      const unit = spec.units[unitId]
      if (unit && unit.connections) {
        for (const connection of Object.values(unit.connections)) {
          if (connection.unitId && checkCycles(connection.unitId)) {
            return true
          }
        }
      }

      recursionStack.delete(unitId)
      return false
    }

    // Check each subgraph for cycles
    subgraphs.forEach(subgraph => {
      Object.keys(subgraph.unit).forEach(unitId => {
        checkCycles(unitId)
      })
    })

    // Validate merges
    if (spec.merges) {
      Object.entries(spec.merges).forEach(([mergeId, merge]) => {
        const connectedUnits = new Set<string>()
        Object.entries(merge).forEach(([unitId, pins]) => {
          if (!spec.units[unitId]) {
            errors.push({
              type: ValidationErrorType.INVALID_MERGE,
              message: `Merge ${mergeId} references non-existent unit: ${unitId}`,
              path: ['merges', mergeId, unitId]
            })
          }
          connectedUnits.add(unitId)
        })

        if (connectedUnits.size < 2) {
          errors.push({
            type: ValidationErrorType.INVALID_MERGE,
            message: `Merge ${mergeId} must connect at least 2 units`,
            path: ['merges', mergeId]
          })
        }
      })
    }

    return errors
  }

  validateUnitSpec(
    spec: UnitBundleSpec,
    options?: ValidationOptions
  ): ValidationResult {
    const errors: ValidationError[] = [
      ...this.validateStructure(spec),
      ...this.validateTypes(spec)
    ]

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateGraphSpec(
    spec: GraphSpec,
    options?: ValidationOptions
  ): ValidationResult {
    const errors: ValidationError[] = [
      ...this.validateGraph(spec)
    ]

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
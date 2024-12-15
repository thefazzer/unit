

import { TreeNode } from '../spec/parser'
import { GraphSpec } from '../types/GraphSpec'
import { UnitBundleSpec } from '../types/UnitBundleSpec'

export enum ValidationErrorType {
  INVALID_STRUCTURE = 'invalid_structure',
  TYPE_MISMATCH = 'type_mismatch',
  MISSING_FIELD = 'missing_field',
  INVALID_CONNECTION = 'invalid_connection',
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  INVALID_MERGE = 'invalid_merge',
  INVALID_PIN = 'invalid_pin',
  GENERIC_CONSTRAINT = 'generic_constraint'
}

export interface ValidationError {
  type: ValidationErrorType
  message: string
  path?: string[]
  expected?: string
  actual?: string
  node?: TreeNode
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface StructureValidationOptions {
  requireAllPins?: boolean
  allowExtraFields?: boolean
  validateMerges?: boolean
}

export interface TypeValidationOptions {
  checkGenerics?: boolean
  strictTypeChecking?: boolean
  allowImplicitConversion?: boolean
}

export interface GraphValidationOptions {
  allowCycles?: boolean
  requireConnected?: boolean
  validateSubgraphs?: boolean
}

export interface ValidationOptions {
  structure?: StructureValidationOptions
  type?: TypeValidationOptions
  graph?: GraphValidationOptions
}

export interface Validator {
  validateUnitSpec(spec: UnitBundleSpec, options?: ValidationOptions): ValidationResult
  validateGraphSpec(spec: GraphSpec, options?: ValidationOptions): ValidationResult
}
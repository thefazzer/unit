

import { UnitValidator } from '../../validation/UnitValidator'
import { ValidationErrorType } from '../../validation/types'
import { system } from '../util/system'
import { ID_IDENTITY } from '../../system/_ids'
import { assert } from '../../util/assert'

describe('UnitValidator', () => {
  const validator = new UnitValidator(system.specs)

  describe('validateUnitSpec', () => {
    it('should validate a valid identity unit spec', () => {
      const spec = {
        unit: {
          id: ID_IDENTITY,
          input: {
            a: {
              constant: true,
              data: '1'
            }
          },
          output: {}
        }
      }

      const result = validator.validateUnitSpec(spec)
      assert(result.valid)
      assert.equal(result.errors.length, 0)
    })

    it('should detect missing unit field', () => {
      const spec = {} as any

      const result = validator.validateUnitSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.MISSING_FIELD)
      assert.equal(result.errors[0].path![0], 'unit')
    })

    it('should detect missing unit id', () => {
      const spec = {
        unit: {
          input: {},
          output: {}
        }
      }

      const result = validator.validateUnitSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.MISSING_FIELD)
      assert.deepEqual(result.errors[0].path, ['unit', 'id'])
    })

    it('should detect invalid constant pin', () => {
      const spec = {
        unit: {
          id: ID_IDENTITY,
          input: {
            a: {
              constant: true
            }
          }
        }
      }

      const result = validator.validateUnitSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.INVALID_PIN)
    })

    it('should detect type mismatch in constant data', () => {
      const spec = {
        unit: {
          id: ID_IDENTITY,
          input: {
            a: {
              constant: true,
              data: '"string"' // Identity expects number
            }
          }
        }
      }

      const result = validator.validateUnitSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.TYPE_MISMATCH)
    })
  })

  describe('validateGraphSpec', () => {
    it('should validate a valid graph spec', () => {
      const spec = {
        id: 'test',
        units: {
          a: { id: ID_IDENTITY },
          b: { id: ID_IDENTITY }
        },
        merges: {
          merge1: {
            a: { output: { a: true }},
            b: { input: { a: true }}
          }
        }
      }

      const result = validator.validateGraphSpec(spec)
      assert(result.valid)
      assert.equal(result.errors.length, 0)
    })

    it('should detect circular dependencies', () => {
      const spec = {
        id: 'test',
        units: {
          a: {
            id: ID_IDENTITY,
            connections: {
              a: { unitId: 'b' }
            }
          },
          b: {
            id: ID_IDENTITY,
            connections: {
              a: { unitId: 'a' }
            }
          }
        }
      }

      const result = validator.validateGraphSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.CIRCULAR_DEPENDENCY)
    })

    it('should detect invalid merge references', () => {
      const spec = {
        id: 'test',
        units: {
          a: { id: ID_IDENTITY }
        },
        merges: {
          merge1: {
            a: { output: { a: true }},
            b: { input: { a: true }} // Unit b doesn't exist
          }
        }
      }

      const result = validator.validateGraphSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.INVALID_MERGE)
    })

    it('should detect merges with insufficient connections', () => {
      const spec = {
        id: 'test',
        units: {
          a: { id: ID_IDENTITY }
        },
        merges: {
          merge1: {
            a: { output: { a: true }}
          }
        }
      }

      const result = validator.validateGraphSpec(spec)
      assert(!result.valid)
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].type, ValidationErrorType.INVALID_MERGE)
    })
  })
})
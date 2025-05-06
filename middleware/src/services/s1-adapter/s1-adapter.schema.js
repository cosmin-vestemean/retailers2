// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const s1AdapterSchema = {
  $id: 'S1Adapter',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'text'],
  properties: {
    id: { type: 'number' },
    text: { type: 'string' }
  }
}
export const s1AdapterValidator = getValidator(s1AdapterSchema, dataValidator)
export const s1AdapterResolver = resolve({})

export const s1AdapterExternalResolver = resolve({})

// Schema for creating new data
export const s1AdapterDataSchema = {
  $id: 'S1AdapterData',
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    ...s1AdapterSchema.properties
  }
}
export const s1AdapterDataValidator = getValidator(s1AdapterDataSchema, dataValidator)
export const s1AdapterDataResolver = resolve({})

// Schema for updating existing data
export const s1AdapterPatchSchema = {
  $id: 'S1AdapterPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...s1AdapterSchema.properties
  }
}
export const s1AdapterPatchValidator = getValidator(s1AdapterPatchSchema, dataValidator)
export const s1AdapterPatchResolver = resolve({})

// Schema for allowed query properties
export const s1AdapterQuerySchema = {
  $id: 'S1AdapterQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(s1AdapterSchema.properties)
  }
}
export const s1AdapterQueryValidator = getValidator(s1AdapterQuerySchema, queryValidator)
export const s1AdapterQueryResolver = resolve({})

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const processingJobsSchema = {
  $id: 'ProcessingJobs',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'text'],
  properties: {
    id: { type: 'number' },
    text: { type: 'string' }
  }
}
export const processingJobsValidator = getValidator(processingJobsSchema, dataValidator)
export const processingJobsResolver = resolve({})

export const processingJobsExternalResolver = resolve({})

// Schema for creating new data
export const processingJobsDataSchema = {
  $id: 'ProcessingJobsData',
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    ...processingJobsSchema.properties
  }
}
export const processingJobsDataValidator = getValidator(processingJobsDataSchema, dataValidator)
export const processingJobsDataResolver = resolve({})

// Schema for updating existing data
export const processingJobsPatchSchema = {
  $id: 'ProcessingJobsPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...processingJobsSchema.properties
  }
}
export const processingJobsPatchValidator = getValidator(processingJobsPatchSchema, dataValidator)
export const processingJobsPatchResolver = resolve({})

// Schema for allowed query properties
export const processingJobsQuerySchema = {
  $id: 'ProcessingJobsQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(processingJobsSchema.properties)
  }
}
export const processingJobsQueryValidator = getValidator(processingJobsQuerySchema, queryValidator)
export const processingJobsQueryResolver = resolve({})

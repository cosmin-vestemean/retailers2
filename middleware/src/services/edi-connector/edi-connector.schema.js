// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const ediConnectorSchema = {
  $id: 'EdiConnector',
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: { type: 'number' },
    cccsftp: { type: 'number' }, // Primary key from database
    trdr_retailer: { type: 'number' }, // FK to retailer
    trdr_client: { type: 'number' }, // FK to client
    url: { type: 'string' },
    port: { type: 'number', nullable: true },
    username: { type: 'string' },
    passphrase: { type: 'string' },
    initialdirin: { type: 'string' },
    initialdirout: { type: 'string' },
    fingerprint: { type: 'string', nullable: true },
    privatekey: { type: 'string', nullable: true },
    retailerName: { type: 'string' }, // Virtual field for display
    clientName: { type: 'string' } // Virtual field for display
  }
}
export const ediConnectorValidator = getValidator(ediConnectorSchema, dataValidator)
export const ediConnectorResolver = resolve({})

export const ediConnectorExternalResolver = resolve({})

// Schema for creating new data
export const ediConnectorDataSchema = {
  $id: 'EdiConnectorData',
  type: 'object',
  additionalProperties: false,
  required: ['trdr_retailer', 'trdr_client', 'url', 'username', 'passphrase', 'initialdirin', 'initialdirout'],
  properties: {
    ...ediConnectorSchema.properties
  }
}
export const ediConnectorDataValidator = getValidator(ediConnectorDataSchema, dataValidator)
export const ediConnectorDataResolver = resolve({})

// Schema for updating existing data
export const ediConnectorPatchSchema = {
  $id: 'EdiConnectorPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...ediConnectorSchema.properties,
    $test: { type: 'boolean' } // Special flag to test connection
  }
}
export const ediConnectorPatchValidator = getValidator(ediConnectorPatchSchema, dataValidator)
export const ediConnectorPatchResolver = resolve({})

// Schema for allowed query properties
export const ediConnectorQuerySchema = {
  $id: 'EdiConnectorQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(ediConnectorSchema.properties)
  }
}
export const ediConnectorQueryValidator = getValidator(ediConnectorQuerySchema, queryValidator)
export const ediConnectorQueryResolver = resolve({})

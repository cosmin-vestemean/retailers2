// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, getValidator, querySyntax } from '@feathersjs/schema'
import { dataValidator, queryValidator } from '../../validators.js'

// Main data model schema
export const notificationsSchema = {
  $id: 'Notifications',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'text'],
  properties: {
    id: { type: 'number' },
    text: { type: 'string' }
  }
}
export const notificationsValidator = getValidator(notificationsSchema, dataValidator)
export const notificationsResolver = resolve({})

export const notificationsExternalResolver = resolve({})

// Schema for creating new data
export const notificationsDataSchema = {
  $id: 'NotificationsData',
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    ...notificationsSchema.properties
  }
}
export const notificationsDataValidator = getValidator(notificationsDataSchema, dataValidator)
export const notificationsDataResolver = resolve({})

// Schema for updating existing data
export const notificationsPatchSchema = {
  $id: 'NotificationsPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...notificationsSchema.properties
  }
}
export const notificationsPatchValidator = getValidator(notificationsPatchSchema, dataValidator)
export const notificationsPatchResolver = resolve({})

// Schema for allowed query properties
export const notificationsQuerySchema = {
  $id: 'NotificationsQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(notificationsSchema.properties)
  }
}
export const notificationsQueryValidator = getValidator(notificationsQuerySchema, queryValidator)
export const notificationsQueryResolver = resolve({})

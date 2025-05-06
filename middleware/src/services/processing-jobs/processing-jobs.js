// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  processingJobsDataValidator,
  processingJobsPatchValidator,
  processingJobsQueryValidator,
  processingJobsResolver,
  processingJobsExternalResolver,
  processingJobsDataResolver,
  processingJobsPatchResolver,
  processingJobsQueryResolver
} from './processing-jobs.schema.js'
import { ProcessingJobsService, getOptions } from './processing-jobs.class.js'

export const processingJobsPath = '/processing-jobs'
export const processingJobsMethods = ['find', 'get', 'create', 'patch', 'remove']

export * from './processing-jobs.class.js'
export * from './processing-jobs.schema.js'

// A configure function that registers the service and its hooks via `app.configure`
export const processingJobs = app => {
  // Register our service on the Feathers application
  app.use(processingJobsPath, new ProcessingJobsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: processingJobsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(processingJobsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(processingJobsExternalResolver),
        schemaHooks.resolveResult(processingJobsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(processingJobsQueryValidator),
        schemaHooks.resolveQuery(processingJobsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(processingJobsDataValidator),
        schemaHooks.resolveData(processingJobsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(processingJobsPatchValidator),
        schemaHooks.resolveData(processingJobsPatchResolver)
      ],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

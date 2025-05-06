// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { S1AdapterService, getOptions } from './s1-adapter.class.js'

export const s1AdapterPath = '/s1-adapter'
export const s1AdapterMethods = ['find', 'get', 'create', 'patch', 'remove']

export * from './s1-adapter.class.js'

// A configure function that registers the service and its hooks via `app.configure`
export const s1Adapter = app => {
  // Register our service on the Feathers application
  app.use(s1AdapterPath, new S1AdapterService(getOptions(app), app), {
    // A list of all methods this service exposes externally
    methods: s1AdapterMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(s1AdapterPath).hooks({
    around: {
      all: [authenticate('jwt')]
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      patch: [],
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

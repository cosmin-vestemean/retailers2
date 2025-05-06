// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { EdiConnectorService, getOptions } from './edi-connector.class.js'
import { ediConnectorPath, ediConnectorMethods } from './edi-connector.shared.js'

export * from './edi-connector.class.js'

// A configure function that registers the service and its hooks via `app.configure`
export const ediConnector = app => {
  // Register our service on the Feathers application
  app.use(ediConnectorPath, new EdiConnectorService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ediConnectorMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(ediConnectorPath).hooks({
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

import { user } from './users/users.js'
import { notifications } from './notifications/notifications.js'
import { processingJobs } from './processing-jobs/processing-jobs.js'
import { s1Adapter } from './s1-adapter/s1-adapter.js'
import { ediConnector } from './edi-connector/edi-connector.js'
export const services = app => {
  app.configure(user)

  app.configure(notifications)

  app.configure(processingJobs)

  app.configure(s1Adapter)

  app.configure(ediConnector)

  // All services will be registered here
}

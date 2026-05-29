import '@feathersjs/transport-commons'
import { logger } from './logger.js'

export const channels = app => {
  logger.warn(
    'Publishing all events to all authenticated users. See `channels.js` and https://dove.feathersjs.com/api/channels.html'
  )

  app.on('connection', connection => {
    app.channel('anonymous').join(connection)
  })

  app.on('login', (authResult, { connection }) => {
    if (connection) {
      app.channel('anonymous').leave(connection)
      app.channel('authenticated').join(connection)
    }
  })

  // Only publish socket.io connections—never REST!
  app.publish((data, context) => {
    if (context.params.provider === 'socketio') {
      return app.channel('authenticated')
    }
    return []    // empty array means “don’t send over HTTP”
  })
}

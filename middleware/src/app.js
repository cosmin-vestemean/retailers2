// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers';
import configuration from '@feathersjs/configuration';
import {
  koa,
  rest,
  bodyParser,
  errorHandler,
  parseAuthentication,
  cors,
  serveStatic
} from '@feathersjs/koa';
//import socketio from '@feathersjs/socketio';
import { configurationValidator } from './configuration.js';
import { logError } from './hooks/log-error.js';
import { services } from './services/index.js';
import { authentication } from './authentication.js';

// 1) Creez Feathers + înfăşor în Koa
const raw = feathers();
const app = koa(raw);

// 2) Încarc configuraţia (default.json, etc)
app.configure(configuration(configurationValidator));

// 3) Middlewares Koa/Feathers de bază
app.use(cors());
app.use(serveStatic(app.get('public')));

app.use(bodyParser());

// 1) register the REST transport (this sets context.params.http)
app.configure(rest());

// 2) then parse the incoming auth header
app.use(parseAuthentication());

// 3) finally configure the authentication service
app.configure(authentication);

app.configure(services);
// app.configure(channels);

// errorHandler MUST be last
app.use(errorHandler());

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError]
  },
  before: {},
  after: {},
  error: {}
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: []
})

// 6) Seed-uiesc un user minim la pornire
app.on('setup', async server => {
  const users = app.service('users');
  try {
    // Dacă nu există deja
    const { total } = await users.find({ query: { email: 'admin@petfactory.local' } });
    if (!total) {
      await users.create({
        email: 'admin@petfactory.local',
        password: 'secret123',
        roles: ['admin']
      });
      console.log('> Seed user creat: admin@petfactory.local / secret123');
    }
  } catch (err) {
    if (err.code === 409) {
      console.log('> Seed user deja există, skip.');
    } else {
      console.error('> Eroare la crearea seed-user:', err);
    }
  }
});

export { app };
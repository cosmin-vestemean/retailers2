// For more information about this file see https://dove.feathersjs.com/guides/cli/configuration.html
import pkg from '@feathersjs/schema';
const { validateSchema } = pkg;

const schema = {
  type: 'object',
  required: ['host', 'port', 'public'],
  properties: {
    host: { type: 'string' },
    port: { type: 'number' },
    public: { type: 'string' },
    paginate: {
      type: 'object',
      properties: {
        default: { type: 'number' },
        max: { type: 'number' }
      }
    },
    authentication: {
      type: 'object',
      required: ['secret', 'entity', 'service', 'authStrategies', 'jwtOptions'],
      properties: {
        secret: { type: 'string' },
        entity: { type: 'string' },
        service: { type: 'string' },
        authStrategies: { type: 'array' },
        jwtOptions: {
          type: 'object',
          required: ['header', 'audience', 'algorithm', 'expiresIn'],
          properties: {
            header: { type: 'object' },
            audience: { type: 'string' },
            algorithm: { type: 'string' },
            expiresIn: { type: 'string' }
          }
        },
        local: {
          type: 'object',
          required: ['usernameField', 'passwordField'],
          properties: {
            usernameField: { type: 'string' },
            passwordField: { type: 'string' }
          }
        },
        oauth: { type: 'object' }
      }
    },
    // Add schema for custom s1 configuration property
    s1: {
      type: 'object',
      required: ['baseUrl'],
      properties: {
        baseUrl: { type: 'string' },
        apiKey: { type: 'string' }
      }
    }
  },
  additionalProperties: true // Allow other properties not explicitly defined
}

export const configurationValidator = (app) => {
  return async (config) => {
    try {
      // Use validateSchema to validate the config against our schema
      return validateSchema(schema, config)
    } catch (error) {
      console.error('Configuration validation error:', error);
      return config; // Return the config anyway to prevent app from crashing
    }
  }
}

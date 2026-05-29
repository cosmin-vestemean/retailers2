// For more information about this file see https://dove.feathersjs.com/guides/cli/configuration.html
import pkg from '@feathersjs/schema';
const { validateSchema } = pkg;

const schema = {
  type: 'object',
  required: ['host', 'port', 'public', 'authentication', 's1'], // Asigură-te că toate secțiunile principale sunt necesare
  properties: {
    host: { type: 'string' },
    port: { type: 'number' },
    public: { type: 'string' },
    origins: { type: 'array', items: { type: 'string' } }, // Adăugat pentru a corespunde cu default.json
    paginate: {
      type: 'object',
      properties: {
        default: { type: 'number' },
        max: { type: 'number' }
      }
    },
    authentication: {
      type: 'object',
      required: ['secret', 'entity', 'service', 'authStrategies', 'jwtOptions', 'local'],
      properties: {
        secret: { type: 'string' },
        entity: { type: 'string' },
        service: { type: 'string' },
        authStrategies: { type: 'array', items: { type: 'string' } },
        jwtOptions: {
          type: 'object',
          required: ['header', 'audience', 'algorithm', 'expiresIn'],
          properties: {
            header: { type: 'object' }, // Poți detalia structura dacă este necesar
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
        }
        // oauth: { type: 'object' } // Eliminat dacă nu este folosit
      },
      additionalProperties: false // Fii mai strict pentru secțiunea de autentificare
    },
    s1: {
      type: 'object',
      required: ['baseUrl', 'username', 'password', 'appId', 'company'],
      properties: {
        baseUrl: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
        appId: { type: 'number' },
        company: { type: 'number' }
      },
      additionalProperties: false // Fii mai strict pentru secțiunea s1
    }
  },
  additionalProperties: true // Permite alte proprietăți la nivel rădăcină, dacă este necesar
};

export const configurationValidator = (app) => { // app nu este folosit aici, poate fi eliminat dacă nu e necesar pentru altceva
  return async (config) => {
    try {
      const validatedConfig = validateSchema(schema, config);
      // validateSchema ar trebui să arunce o eroare dacă validarea eșuează.
      // Dacă ajunge aici, configurația este considerată validă conform schemei.
      return validatedConfig;
    } catch (error) {
      console.error('!!! CRITICAL CONFIGURATION VALIDATION ERROR !!!');
      console.error('Configuration does not match schema:', error.message);
      if (error.errors) { // `validateSchema` poate returna detalii în `error.errors`
        console.error('Validation details:', JSON.stringify(error.errors, null, 2));
      }
      // Este crucial să oprești aplicația sau să arunci eroarea mai departe
      // pentru a preveni rularea cu o configurație invalidă.
      // Alegerea de a arunca eroarea va opri pornirea Feathers dacă configurarea e greșită.
      throw new Error(`Configuration validation failed: ${error.message}. Check console for details.`);
      // Alternativ, poți face process.exit(1) dacă preferi o oprire imediată.
      // return config; // NU returna configurația originală la eroare!
    }
  };
};

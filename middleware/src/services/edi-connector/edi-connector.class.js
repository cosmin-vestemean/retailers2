// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html
import { BadRequest, NotFound } from '@feathersjs/errors';
import { FtpTestFactory } from './connection-testers/ftp-tester.js';
import { SftpTestFactory } from './connection-testers/sftp-tester.js';
import { HttpTestFactory } from './connection-testers/http-tester.js';

export class EdiConnectorService {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
  }

  /**
   * Find method - Get all EDI connectors with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Array of connectors
   */
  async find(params) {
    try {
      const s1Service = this.app.service('s1-adapter');
      const response = await s1Service.create({
        action: 'getEdiConnectors',
        params: params?.query
      });

      if (!response.success) {
        throw new Error(response.message || 'Error retrieving EDI connectors');
      }

      return response.data || [];
    } catch (error) {
      this.app.logger.error('Error in edi-connector find method:', error.message);
      throw error;
    }
  }

  /**
   * Get method - Get a single EDI connector by ID
   * @param {number|string} id - The connector ID
   * @returns {Promise<Object>} - The connector object
   */
  async get(id, params) {
    try {
      const s1Service = this.app.service('s1-adapter');
      const response = await s1Service.create({
        action: 'getEdiConnector',
        params: { id: parseInt(id) }
      });

      if (!response.success) {
        throw new NotFound(response.message || `Connector with ID ${id} not found`);
      }

      return response.data;
    } catch (error) {
      this.app.logger.error(`Error in edi-connector get method for ID ${id}:`, error.message);
      if (error.name === 'NotFound') {
        throw error;
      }
      throw new Error(`Error retrieving connector with ID ${id}: ${error.message}`);
    }
  }

  /**
   * Create method - Create a new EDI connector
   * @param {Object} data - The connector data
   * @returns {Promise<Object>} - The created connector
   */
  async create(data, params) {
    try {
      // First check if connector already exists for this retailer/client combination
      const s1Service = this.app.service('s1-adapter');
      const existsResponse = await s1Service.create({
        action: 'checkEdiConnectorExists',
        params: {
          trdr_retailer: data.trdr_retailer,
          trdr_client: data.trdr_client
        }
      });

      if (!existsResponse.success) {
        throw new Error(existsResponse.message || 'Error checking for existing connector');
      }

      if (existsResponse.exists) {
        throw new BadRequest(`Connector already exists for retailer ${data.trdr_retailer} and client ${data.trdr_client}`);
      }

      // Convert camelCase to database field names (UPPERCASE)
      const dbRecord = {
        TRDR_RETAILER: data.trdr_retailer,
        TRDR_CLIENT: data.trdr_client,
        URL: data.url,
        PORT: data.port,
        USERNAME: data.username,
        PASSPHRASE: data.passphrase,
        INITIALDIRIN: data.initialdirin,
        INITIALDIROUT: data.initialdirout,
        FINGERPRINT: data.fingerprint,
        PRIVATEKEY: data.privatekey
      };

      const createResponse = await s1Service.create({
        action: 'createEdiConnector',
        data: dbRecord
      });

      if (!createResponse.success) {
        throw new Error(createResponse.message || 'Error creating EDI connector');
      }

      // Get the created connector to return
      return this.get(createResponse.id);
    } catch (error) {
      this.app.logger.error('Error in edi-connector create method:', error.message);
      if (error.name === 'BadRequest') {
        throw error;
      }
      throw new Error(`Error creating connector: ${error.message}`);
    }
  }

  /**
   * Update method - Replace a connector with new data
   * @param {number|string} id - The connector ID
   * @param {Object} data - The updated connector data
   * @returns {Promise<Object>} - The updated connector
   */
  async update(id, data, params) {
    return this.patch(id, data, params);
  }

  /**
   * Patch method - Update a connector with new data
   * @param {number|string} id - The connector ID
   * @param {Object} data - The partial connector data
   * @returns {Promise<Object>} - The updated connector
   */
  async patch(id, data, params) {
    try {
      const s1Service = this.app.service('s1-adapter');
      
      // Check for connection test flag
      if (data.$test === true) {
        return this.testConnection(id, data);
      }

      // Convert camelCase to database field names (UPPERCASE)
      const dbRecord = {};
      
      // Map fields if they exist in the data
      if (data.url !== undefined) dbRecord.URL = data.url;
      if (data.port !== undefined) dbRecord.PORT = data.port;
      if (data.username !== undefined) dbRecord.USERNAME = data.username;
      if (data.passphrase !== undefined) dbRecord.PASSPHRASE = data.passphrase;
      if (data.initialdirin !== undefined) dbRecord.INITIALDIRIN = data.initialdirin;
      if (data.initialdirout !== undefined) dbRecord.INITIALDIROUT = data.initialdirout;
      if (data.fingerprint !== undefined) dbRecord.FINGERPRINT = data.fingerprint;
      if (data.privatekey !== undefined) dbRecord.PRIVATEKEY = data.privatekey;

      const updateResponse = await s1Service.create({
        action: 'updateEdiConnector',
        params: { id: parseInt(id) },
        data: dbRecord
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.message || `Error updating connector with ID ${id}`);
      }

      // Get the updated connector to return
      return this.get(id);
    } catch (error) {
      this.app.logger.error(`Error in edi-connector patch method for ID ${id}:`, error.message);
      throw new Error(`Error updating connector with ID ${id}: ${error.message}`);
    }
  }

  /**
   * Remove method - Delete a connector
   * @param {number|string} id - The connector ID
   * @returns {Promise<Object>} - The deleted connector
   */
  async remove(id, params) {
    try {
      // First get the connector to return it after deletion
      const connector = await this.get(id);
      
      const s1Service = this.app.service('s1-adapter');
      const deleteResponse = await s1Service.create({
        action: 'deleteEdiConnector',
        params: { id: parseInt(id) }
      });

      if (!deleteResponse.success) {
        throw new Error(deleteResponse.message || `Error deleting connector with ID ${id}`);
      }

      return connector;
    } catch (error) {
      this.app.logger.error(`Error in edi-connector remove method for ID ${id}:`, error.message);
      throw new Error(`Error deleting connector with ID ${id}: ${error.message}`);
    }
  }

  /**
   * Test a connector's connection
   * @param {number|string} id - The connector ID
   * @param {Object} data - Additional test parameters
   * @returns {Promise<Object>} - Test results
   */
  async testConnection(id, data) {
    try {
      // Get the connector details
      const connector = await this.get(id);
      
      // Create the appropriate connection tester based on URL
      let tester;
      const url = connector.url.toLowerCase();
      
      if (url.startsWith('ftp://')) {
        tester = new FtpTestFactory().create();
      } else if (url.startsWith('sftp://')) {
        tester = new SftpTestFactory().create();
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        tester = new HttpTestFactory().create();
      } else {
        throw new BadRequest('Unsupported connection type');
      }

      // Test the connection
      const result = await tester.testConnection(connector);
      
      return {
        ...connector,
        testResult: result
      };
    } catch (error) {
      this.app.logger.error(`Error testing connection for connector ID ${id}:`, error.message);
      
      return {
        id: parseInt(id),
        success: false,
        error: error.message
      };
    }
  }
}

export const getOptions = (app) => {
  return { app };
}
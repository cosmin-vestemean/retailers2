import axios from 'axios';
import { NotImplemented } from '@feathersjs/errors';

export class S1AdapterService {
  constructor(options, app) {
    this.options = options || {};
    this.app = app;
    
    // Safely handle app configuration
    let s1Config = {};
    try {
      // Check if app exists and has the get method before attempting to use it
      if (app && typeof app.get === 'function') {
        s1Config = app.get('s1') || {};
      } else {
        console.warn('S1AdapterService: app object is not properly initialized or missing get method');
      }
    } catch (error) {
      console.error('S1AdapterService: Error accessing app configuration:', error);
    }
    
    // Get S1 base URL from configuration or use default
    this.s1BaseUrl = s1Config.baseUrl || 'https://petfactory.oncloud.gr/s1services';
    
    // Configure axios instance with transformResponse to handle JSON strings
    this.httpClient = axios.create({
      baseURL: this.s1BaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
      // Handle S1 AJS JSON string responses
      transformResponse: [function(data) {
        // S1 AJS endpoints return JSON strings, so we need to parse them
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch (e) {
            // If not valid JSON, return as-is
            return data;
          }
        }
        return data;
      }]
    });

    // Set up logging (safely handle app.logger)
    this.logger = (app && app.logger) ? app.logger : console;
  }

  // We'll use 'create' to proxy requests to S1 based on 'action'
  async create(data, params) {
    const { action, payload, params: actionParams } = data;

    if (!action) {
      this.logger.error('S1 Adapter: "action" is required in the request data.');
      return { success: false, message: 'S1 Adapter: "action" is required in the request data.' };
    }

    this.logger.info(`S1 Adapter: Received action '${action}'`);

    // Route based on action
    switch (action) {
      case 'storeDocumentWithRouting':
        if (!payload) {
          this.logger.error('S1 Adapter: "payload" is required for action "storeDocumentWithRouting".');
          return { success: false, message: 'S1 Adapter: "payload" is required for action "storeDocumentWithRouting".' };
        }
        return this._proxyStoreDocument(payload);

      // EDI Connector operations
      case 'getEdiConnectors':
        return this._getEdiConnectors(actionParams);
      
      case 'getEdiConnector':
        if (!actionParams || !actionParams.id) {
          this.logger.error('S1 Adapter: "id" parameter is required for action "getEdiConnector".');
          return { success: false, message: 'S1 Adapter: "id" parameter is required for action "getEdiConnector".' };
        }
        return this._getEdiConnector(actionParams.id);
      
      case 'checkEdiConnectorExists':
        if (!actionParams || !actionParams.trdr_retailer || !actionParams.trdr_client) {
          this.logger.error('S1 Adapter: "trdr_retailer" and "trdr_client" parameters are required for action "checkEdiConnectorExists".');
          return { 
            success: false, 
            message: 'S1 Adapter: "trdr_retailer" and "trdr_client" parameters are required for action "checkEdiConnectorExists".' 
          };
        }
        return this._checkEdiConnectorExists(actionParams.trdr_retailer, actionParams.trdr_client);
      
      case 'createEdiConnector':
        if (!data.data) {
          this.logger.error('S1 Adapter: "data" object is required for action "createEdiConnector".');
          return { success: false, message: 'S1 Adapter: "data" object is required for action "createEdiConnector".' };
        }
        return this._createEdiConnector(data.data);
      
      case 'updateEdiConnector':
        if (!actionParams || !actionParams.id || !data.data) {
          this.logger.error('S1 Adapter: "id" parameter and "data" object are required for action "updateEdiConnector".');
          return { 
            success: false, 
            message: 'S1 Adapter: "id" parameter and "data" object are required for action "updateEdiConnector".' 
          };
        }
        return this._updateEdiConnector(actionParams.id, data.data);
      
      case 'deleteEdiConnector':
        if (!actionParams || !actionParams.id) {
          this.logger.error('S1 Adapter: "id" parameter is required for action "deleteEdiConnector".');
          return { success: false, message: 'S1 Adapter: "id" parameter is required for action "deleteEdiConnector".' };
        }
        return this._deleteEdiConnector(actionParams.id);

      default:
        this.logger.error(`S1 Adapter: Unknown action '${action}'`);
        return { success: false, message: `Action '${action}' is not implemented in S1 Adapter.` };
    }
  }

  // Private methods for specific S1 endpoints
  async _proxyStoreDocument(payload) {
    const { xmlContent, filename, provider, gln } = payload;
    const endpoint = '/JS/AJS_edi_integration/storeDocumentWithRouting'; // Adjust path if needed

    if (!xmlContent || !filename || !provider || !gln) {
      this.logger.error('S1 Adapter (_proxyStoreDocument): Missing required payload fields.');
      return {
        success: false,
        message: 'Missing required payload fields (xmlContent, filename, provider, gln).'
      };
    }

    this.logger.info(`S1 Adapter: Calling S1 endpoint ${endpoint} for file ${filename} (GLN: ${gln})`);

    try {
      const s1RequestPayload = { xmlContent, filename, provider, gln };
      const response = await this.httpClient.post(endpoint, s1RequestPayload);

      this.logger.info(`S1 Adapter: Received response from S1 for ${filename}: Status ${response.status}`);
      
      // Check if we received a valid response object
      if (response.data) {
        if (typeof response.data === 'object' && 'success' in response.data) {
          // Perfect! We have a properly structured response
          return response.data;
        } else if (typeof response.data === 'string') {
          // S1 may have returned a JSON string that wasn't auto-parsed
          try {
            const parsedData = JSON.parse(response.data);
            return parsedData;
          } catch (parseError) {
            this.logger.warn(`S1 Adapter: Could not parse response string as JSON for ${filename}`);
            return {
              success: false,
              message: 'Invalid JSON response from S1',
              rawResponse: response.data
            };
          }
        } else {
          // We got something unexpected
          this.logger.warn(`S1 Adapter: Unexpected response format for ${filename}`);
          return {
            success: false,
            message: 'Unexpected response format from S1',
            rawResponse: response.data
          };
        }
      } else {
        return {
          success: false,
          message: 'Empty response from S1',
        };
      }
    } catch (error) {
      let errorMessage = error.message;
      let errorDetails = null;

      if (error.response) {
        // Error with response from server (4xx, 5xx)
        this.logger.error(`S1 Adapter: Error response from S1 endpoint for ${filename}. Status: ${error.response.status}`);
        errorMessage = `S1 API Error (${error.response.status})`;
        errorDetails = error.response.data;
      } else if (error.request) {
        // No response received
        this.logger.error(`S1 Adapter: No response received from S1 for ${filename}`);
        errorMessage = 'S1 API No Response';
      } else {
        // Error setting up request
        this.logger.error(`S1 Adapter: Request setup error for ${filename}: ${error.message}`);
        errorMessage = 'Error setting up request to S1';
      }

      // Return structured error object instead of throwing
      return {
        success: false,
        message: errorMessage,
        details: errorDetails,
        error: error.message
      };
    }
  }

  /**
   * Gets all EDI connectors with optional filtering
   * @param {Object} params Optional filter parameters
   * @returns {Promise<Object>} List of EDI connectors
   */
  async _getEdiConnectors(params) {
    const endpoint = '/JS/AJS_edi_integration/getEdiConnectors';
    this.logger.info(`S1 Adapter: Calling S1 endpoint ${endpoint}`);

    try {
      // Build query parameters for filtering if provided
      const queryParams = params || {};
      
      // Call Soft1 API to retrieve connectors
      const response = await this.httpClient.post(endpoint, queryParams);
      
      return this._processResponse(response, 'getEdiConnectors');
    } catch (error) {
      return this._handleApiError(error, 'getEdiConnectors');
    }
  }

  /**
   * Gets a single EDI connector by ID
   * @param {number} id The EDI connector ID
   * @returns {Promise<Object>} Single EDI connector
   */
  async _getEdiConnector(id) {
    const endpoint = '/JS/AJS_edi_integration/getEdiConnector';
    this.logger.info(`S1 Adapter: Calling S1 endpoint ${endpoint} for connector ID ${id}`);

    try {
      const params = { id };
      const response = await this.httpClient.post(endpoint, params);
      
      return this._processResponse(response, 'getEdiConnector');
    } catch (error) {
      return this._handleApiError(error, 'getEdiConnector');
    }
  }

  /**
   * Checks if an EDI connector already exists for a retailer/client combination
   * @param {number} retailerId The retailer ID
   * @param {number} clientId The client ID
   * @returns {Promise<Object>} Result with exists flag
   */
  async _checkEdiConnectorExists(retailerId, clientId) {
    const endpoint = '/JS/AJS_edi_integration/checkEdiConnectorExists';
    this.logger.info(`S1 Adapter: Checking if connector exists for retailer ${retailerId} and client ${clientId}`);

    try {
      const params = { 
        TRDR_RETAILER: retailerId,
        TRDR_CLIENT: clientId
      };
      
      const response = await this.httpClient.post(endpoint, params);
      
      return this._processResponse(response, 'checkEdiConnectorExists');
    } catch (error) {
      return this._handleApiError(error, 'checkEdiConnectorExists');
    }
  }

  /**
   * Creates a new EDI connector
   * @param {Object} connectorData The connector data to create
   * @returns {Promise<Object>} Result with new connector ID
   */
  async _createEdiConnector(connectorData) {
    const endpoint = '/JS/AJS_edi_integration/createEdiConnector';
    this.logger.info(`S1 Adapter: Creating new connector for retailer ${connectorData.TRDR_RETAILER}`);

    try {
      const response = await this.httpClient.post(endpoint, connectorData);
      
      return this._processResponse(response, 'createEdiConnector');
    } catch (error) {
      return this._handleApiError(error, 'createEdiConnector');
    }
  }

  /**
   * Updates an existing EDI connector
   * @param {number} id The connector ID to update
   * @param {Object} connectorData The connector data to update
   * @returns {Promise<Object>} Result of the update operation
   */
  async _updateEdiConnector(id, connectorData) {
    const endpoint = '/JS/AJS_edi_integration/updateEdiConnector';
    this.logger.info(`S1 Adapter: Updating connector with ID ${id}`);

    try {
      // Add ID to the connector data for the update
      const updateData = { 
        CCCSFTP: id,
        ...connectorData 
      };
      
      const response = await this.httpClient.post(endpoint, updateData);
      
      return this._processResponse(response, 'updateEdiConnector');
    } catch (error) {
      return this._handleApiError(error, 'updateEdiConnector');
    }
  }

  /**
   * Deletes an EDI connector
   * @param {number} id The connector ID to delete
   * @returns {Promise<Object>} Result of the delete operation
   */
  async _deleteEdiConnector(id) {
    const endpoint = '/JS/AJS_edi_integration/deleteEdiConnector';
    this.logger.info(`S1 Adapter: Deleting connector with ID ${id}`);

    try {
      const params = { id };
      const response = await this.httpClient.post(endpoint, params);
      
      return this._processResponse(response, 'deleteEdiConnector');
    } catch (error) {
      return this._handleApiError(error, 'deleteEdiConnector');
    }
  }

  /**
   * Helper method to process responses from S1 API
   * @param {Object} response The axios response object
   * @param {string} operation The operation name for logging
   * @returns {Object} Processed response
   */
  _processResponse(response, operation) {
    if (response.data) {
      if (typeof response.data === 'object' && 'success' in response.data) {
        // Perfect! We have a properly structured response
        return response.data;
      } else if (typeof response.data === 'string') {
        // S1 may have returned a JSON string that wasn't auto-parsed
        try {
          const parsedData = JSON.parse(response.data);
          return parsedData;
        } catch (parseError) {
          this.logger.warn(`S1 Adapter: Could not parse response string as JSON for operation ${operation}`);
          return {
            success: false,
            message: 'Invalid JSON response from S1',
            rawResponse: response.data
          };
        }
      } else {
        // We got something unexpected
        this.logger.warn(`S1 Adapter: Unexpected response format for operation ${operation}`);
        return {
          success: false,
          message: 'Unexpected response format from S1',
          rawResponse: response.data
        };
      }
    } else {
      return {
        success: false,
        message: 'Empty response from S1',
      };
    }
  }

  /**
   * Helper method to handle errors from S1 API
   * @param {Error} error The error object
   * @param {string} operation The operation name for logging
   * @returns {Object} Error response
   */
  _handleApiError(error, operation) {
    let errorMessage = error.message;
    let errorDetails = null;

    if (error.response) {
      // Error with response from server (4xx, 5xx)
      this.logger.error(`S1 Adapter: Error response from S1 for operation ${operation}. Status: ${error.response.status}`);
      errorMessage = `S1 API Error (${error.response.status})`;
      errorDetails = error.response.data;
    } else if (error.request) {
      // No response received
      this.logger.error(`S1 Adapter: No response received from S1 for operation ${operation}`);
      errorMessage = 'S1 API No Response';
    } else {
      // Error setting up request
      this.logger.error(`S1 Adapter: Request setup error for operation ${operation}: ${error.message}`);
      errorMessage = 'Error setting up request to S1';
    }

    // Return structured error object instead of throwing
    return {
      success: false,
      message: errorMessage,
      details: errorDetails,
      error: error.message
    };
  }

  // Placeholder methods
  async find(params) { throw new NotImplemented('Find method not implemented for s1-adapter'); }
  async get(id, params) { throw new NotImplemented('Get method not implemented for s1-adapter'); }
  async update(id, data, params) { throw new NotImplemented('Update method not implemented for s1-adapter'); }
  async patch(id, data, params) { throw new NotImplemented('Patch method not implemented for s1-adapter'); }
  async remove(id, params) { throw new NotImplemented('Remove method not implemented for s1-adapter'); }
}

export const getOptions = (app) => {
  return { app };
}

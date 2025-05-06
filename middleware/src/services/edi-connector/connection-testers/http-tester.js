// HTTP Connection Tester for EDI Connector service
import axios from 'axios';

/**
 * Factory for creating HTTP connection testers
 */
export class HttpTestFactory {
  /**
   * Creates an HTTP connection tester
   * @returns {HttpTester} HTTP connection tester instance
   */
  create() {
    return new HttpTester();
  }
}

/**
 * HTTP Connection tester implementation
 */
class HttpTester {
  /**
   * Tests connection to an HTTP/HTTPS endpoint
   * @param {Object} connector - The connector details with url, username, passphrase, etc.
   * @returns {Promise<Object>} Test result with success/error information
   */
  async testConnection(connector) {
    const result = { success: true, steps: [] };

    try {
      // Prepare request options
      const requestConfig = {
        method: 'GET',
        url: connector.url,
        timeout: 10000
      };

      if (connector.username) {
        requestConfig.auth = {
          username: connector.username,
          password: connector.passphrase
        };
      }

      result.steps.push({ step: 'prepare_request', success: true });

      // Send request
      const response = await axios(requestConfig);
      const ok = response.status >= 200 && response.status < 300;
      result.steps.push({ step: 'send_request', success: ok, details: `Status: ${response.status}` });

      if (!ok) {
        result.success = false;
        result.error = `Unexpected status code: ${response.status}`;
      } else {
        result.message = 'Connection test completed successfully';
      }
    } catch (err) {
      result.steps.push({ step: 'send_request', success: false, error: err.message });
      result.success = false;
      result.error = `Request failed: ${err.message}`;
    }

    return result;
  }
}

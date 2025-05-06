// FTP Connection Tester for EDI Connector service
import * as ftp from 'basic-ftp';
import { parseConnectionString } from '../utils/connection-parser.js';

/**
 * Factory for creating FTP connection testers
 */
export class FtpTestFactory {
  /**
   * Creates an FTP connection tester
   * @returns {FtpTester} FTP connection tester instance
   */
  create() {
    return new FtpTester();
  }
}

/**
 * FTP Connection tester implementation
 */
class FtpTester {
  /**
   * Tests connection to an FTP server
   * @param {Object} connector - The connector details with url, username, passphrase, etc.
   * @returns {Promise<Object>} Test result with success/error information
   */
  async testConnection(connector) {
    const client = new ftp.Client();
    client.ftp.verbose = false; // Set to true for detailed logging during development
    
    const result = {
      success: true,
      steps: []
    };
    
    try {
      // Parse connection string
      const connection = parseConnectionString(connector.url);
      if (!connection) {
        return {
          success: false,
          error: 'Invalid connection URL format',
          details: 'URL should be in format: ftp://hostname[:port]'
        };
      }
      
      // Configure connection
      const options = {
        host: connection.hostname,
        port: connector.port || connection.port || 21,
        user: connector.username,
        password: connector.passphrase,
        secure: connection.protocol === 'ftps',
        secureOptions: {
          rejectUnauthorized: false // Consider making this configurable
        },
        timeout: 10000 // 10 seconds timeout
      };
      
      // Connect to server
      await client.access(options);
      result.steps.push({ step: 'connect', success: true });
      
      // Test input directory access
      if (connector.initialdirin) {
        try {
          await client.cd(connector.initialdirin);
          result.steps.push({ step: 'check_input_dir', success: true });
          
          // List directory to verify read permissions
          const list = await client.list();
          result.steps.push({ 
            step: 'read_input_dir', 
            success: true,
            details: `Found ${list.length} items`
          });
        } catch (err) {
          result.steps.push({ 
            step: 'check_input_dir', 
            success: false, 
            error: err.message 
          });
          result.success = false;
          result.error = `Input directory check failed: ${err.message}`;
        }
      }
      
      // Test output directory access and write permissions
      if (connector.initialdirout) {
        try {
          await client.cd(connector.initialdirout);
          result.steps.push({ step: 'check_output_dir', success: true });
          
          // Test write permissions
          const testFileName = `test_${Date.now()}.tmp`;
          const testContent = 'EDI Connection Test - ' + new Date().toISOString();
          const buffer = Buffer.from(testContent, 'utf8');
          
          // Upload test file
          await client.uploadFrom(buffer, testFileName);
          result.steps.push({ step: 'test_write', success: true });
          
          // Delete test file (cleanup)
          try {
            await client.remove(testFileName);
            result.steps.push({ step: 'cleanup', success: true });
          } catch (err) {
            result.steps.push({ 
              step: 'cleanup', 
              success: false,
              error: err.message,
              warning: 'Could not remove test file, but write test was successful'
            });
          }
        } catch (err) {
          if (result.steps.length === 1) {
            // Output directory check failed
            result.steps.push({ 
              step: 'check_output_dir', 
              success: false, 
              error: err.message 
            });
          } else {
            // Write test failed
            result.steps.push({ 
              step: 'test_write', 
              success: false, 
              error: err.message 
            });
          }
          
          result.success = false;
          result.error = `Output directory operation failed: ${err.message}`;
        }
      }
      
      if (result.success) {
        result.message = 'Connection test completed successfully';
      }
      
      return result;
    } catch (err) {
      // Connection failure or other unexpected errors
      if (result.steps.length === 0) {
        result.steps.push({ step: 'connect', success: false, error: err.message });
      }
      
      result.success = false;
      result.error = `Connection failed: ${err.message}`;
      return result;
    } finally {
      client.close();
    }
  }
}
// SFTP Connection Tester for EDI Connector service
import { Client } from 'ssh2';
import { parseConnectionString } from '../utils/connection-parser.js';

/**
 * Factory for creating SFTP connection testers
 */
export class SftpTestFactory {
  /**
   * Creates an SFTP connection tester
   * @returns {SftpTester} SFTP connection tester instance
   */
  create() {
    return new SftpTester();
  }
}

/**
 * SFTP Connection tester implementation 
 */
class SftpTester {
  /**
   * Tests connection to an SFTP server
   * @param {Object} connector - The connector details with url, username, passphrase, etc.
   * @returns {Promise<Object>} Test result with success/error information
   */
  async testConnection(connector) {
    return new Promise((resolve) => {
      try {
        // Parse connection URL
        const connection = parseConnectionString(connector.url);
        if (!connection) {
          return resolve({
            success: false,
            error: 'Invalid connection URL format',
            details: 'URL should be in format: sftp://hostname[:port]'
          });
        }
        
        const result = {
          success: true,
          steps: []
        };
        
        const config = {
          host: connection.hostname,
          port: connector.port || connection.port || 22,
          username: connector.username,
          password: connector.passphrase,
          readyTimeout: 10000, // 10 seconds timeout for connection
        };
        
        // If private key is provided, use it for authentication
        if (connector.privatekey) {
          config.privateKey = connector.privatekey;
        }
        
        // If fingerprint is provided, use it for host verification
        if (connector.fingerprint) {
          config.hostVerifier = (key) => {
            // Simple fingerprint comparison
            // In a real implementation this should properly compare 
            // the fingerprint format based on the hash algorithm used
            return key.fingerprint === connector.fingerprint;
          };
        }
        
        const conn = new Client();
        
        conn.on('ready', () => {
          result.steps.push({ step: 'connect', success: true });
          
          // Get SFTP session
          conn.sftp((err, sftp) => {
            if (err) {
              result.steps.push({ 
                step: 'sftp_session', 
                success: false, 
                error: err.message 
              });
              result.success = false;
              result.error = `Failed to start SFTP session: ${err.message}`;
              conn.end();
              return resolve(result);
            }
            
            result.steps.push({ step: 'sftp_session', success: true });
            
            // Test input directory
            if (connector.initialdirin) {
              sftp.stat(connector.initialdirin, (err, stats) => {
                if (err) {
                  result.steps.push({ 
                    step: 'check_input_dir', 
                    success: false, 
                    error: err.message 
                  });
                  result.success = false;
                  result.error = `Input directory check failed: ${err.message}`;
                } else {
                  result.steps.push({ step: 'check_input_dir', success: true });
                }
                
                // Test output directory
                if (connector.initialdirout) {
                  sftp.stat(connector.initialdirout, (err, stats) => {
                    if (err) {
                      result.steps.push({ 
                        step: 'check_output_dir', 
                        success: false, 
                        error: err.message 
                      });
                      result.success = false;
                      result.error = `Output directory check failed: ${err.message}`;
                      conn.end();
                      return resolve(result);
                    }
                    
                    result.steps.push({ step: 'check_output_dir', success: true });
                    
                    // Test write permission
                    const testFileName = `${connector.initialdirout}/test_${Date.now()}.tmp`;
                    const writeStream = sftp.createWriteStream(testFileName);
                    
                    writeStream.on('error', (err) => {
                      result.steps.push({ 
                        step: 'test_write', 
                        success: false, 
                        error: err.message 
                      });
                      result.success = false;
                      result.error = `Write permission test failed: ${err.message}`;
                      conn.end();
                      resolve(result);
                    });
                    
                    writeStream.on('close', () => {
                      result.steps.push({ step: 'test_write', success: true });
                      
                      // Try to clean up test file
                      sftp.unlink(testFileName, (err) => {
                        if (err) {
                          result.steps.push({ 
                            step: 'cleanup', 
                            success: false,
                            error: err.message,
                            warning: 'Could not remove test file, but write test was successful'
                          });
                        } else {
                          result.steps.push({ step: 'cleanup', success: true });
                        }
                        
                        if (result.success) {
                          result.message = 'Connection test completed successfully';
                        }
                        
                        conn.end();
                        resolve(result);
                      });
                    });
                    
                    writeStream.end('EDI Connection Test - ' + new Date().toISOString());
                  });
                } else {
                  // No output directory specified, finish here
                  if (result.success) {
                    result.message = 'Connection test completed successfully';
                  }
                  conn.end();
                  resolve(result);
                }
              });
            } else {
              // No input directory specified, test only output if specified
              if (connector.initialdirout) {
                sftp.stat(connector.initialdirout, (err, stats) => {
                  if (err) {
                    result.steps.push({ 
                      step: 'check_output_dir', 
                      success: false, 
                      error: err.message 
                    });
                    result.success = false;
                    result.error = `Output directory check failed: ${err.message}`;
                    conn.end();
                    return resolve(result);
                  }
                  
                  result.steps.push({ step: 'check_output_dir', success: true });
                  
                  // Testing write permissions
                  const testFileName = `${connector.initialdirout}/test_${Date.now()}.tmp`;
                  const writeStream = sftp.createWriteStream(testFileName);
                  
                  writeStream.on('error', (err) => {
                    result.steps.push({ 
                      step: 'test_write', 
                      success: false, 
                      error: err.message 
                    });
                    result.success = false;
                    result.error = `Write permission test failed: ${err.message}`;
                    conn.end();
                    resolve(result);
                  });
                  
                  writeStream.on('close', () => {
                    result.steps.push({ step: 'test_write', success: true });
                    
                    // Cleanup
                    sftp.unlink(testFileName, (err) => {
                      if (err) {
                        result.steps.push({ 
                          step: 'cleanup', 
                          success: false,
                          error: err.message,
                          warning: 'Could not remove test file, but write test was successful'
                        });
                      } else {
                        result.steps.push({ step: 'cleanup', success: true });
                      }
                      
                      if (result.success) {
                        result.message = 'Connection test completed successfully';
                      }
                      
                      conn.end();
                      resolve(result);
                    });
                  });
                  
                  writeStream.end('EDI Connection Test - ' + new Date().toISOString());
                });
              } else {
                // No directories specified, test only basic connection
                if (result.success) {
                  result.message = 'Connection test completed successfully';
                }
                conn.end();
                resolve(result);
              }
            }
          });
        });
        
        conn.on('error', (err) => {
          result.steps.push({ step: 'connect', success: false, error: err.message });
          result.success = false;
          result.error = `Connection failed: ${err.message}`;
          conn.end();
          resolve(result);
        });
        
        conn.on('timeout', () => {
          result.steps.push({ step: 'connect', success: false, error: 'Connection timeout' });
          result.success = false;
          result.error = 'Connection timed out';
          conn.end();
          resolve(result);
        });
        
        conn.connect(config);
      } catch (error) {
        resolve({
          success: false,
          error: `Unexpected error: ${error.message}`
        });
      }
    });
  }
}
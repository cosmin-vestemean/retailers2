/**
 * Parses a connection string URL into components
 * @param {string} connectionString - URL string (e.g., "ftp://hostname:port")
 * @returns {Object|null} Parsed connection object or null if invalid
 */
export function parseConnectionString(connectionString) {
  if (!connectionString) {
    return null;
  }
  
  try {
    // Handle URLs without protocol
    let urlToParse = connectionString;
    if (!connectionString.includes('://')) {
      // Assume FTP if no protocol specified
      urlToParse = `ftp://${connectionString}`;
    }
    
    const url = new URL(urlToParse);
    
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : null,
      path: url.pathname || '/',
      username: url.username || null,
      password: url.password || null
    };
  } catch (error) {
    // Invalid URL format
    return null;
  }
}

/**
 * Determines the connection type from a URL
 * @param {string} url - The connection URL
 * @returns {string} Connection type: 'ftp', 'sftp', 'http', 'https' or 'unknown'
 */
export function getConnectionType(url) {
  if (!url) {
    return 'unknown';
  }
  
  url = url.toLowerCase();
  
  if (url.startsWith('ftp://')) {
    return 'ftp';
  } else if (url.startsWith('sftp://')) {
    return 'sftp';
  } else if (url.startsWith('http://')) {
    return 'http';
  } else if (url.startsWith('https://')) {
    return 'https';
  } else {
    // Try to guess based on format
    if (url.includes(':22') || url.includes(' 22')) {
      return 'sftp'; // Port 22 typically indicates SFTP
    } else if (url.includes(':21') || url.includes(' 21')) {
      return 'ftp';  // Port 21 typically indicates FTP
    } else if (url.includes(':80') || url.includes(' 80')) {
      return 'http';
    } else if (url.includes(':443') || url.includes(' 443')) {
      return 'https';
    }
  }
  
  return 'unknown';
}
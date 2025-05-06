// filepath: d:\GitHub\Pet-Factory\retailers2\Analiza\s1-scripts\AJS_edi_integration.js
// Cod specific S1 - AJS
// EDI Integration API functions for the PetFactory EDI connector

/**
 * Gets all EDI connectors with optional filtering
 * @param {Object} params Query parameters for filtering
 * @returns {Object} List of EDI connectors with success/error information
 */
function getEdiConnectors(params) {
    try {
        var whereClause = "";
        var queryParams = [X.SYS.COMPANY]; // Always include company as first parameter
        
        // Apply filters if provided
        if (params) {
            // Filter by retailer
            if (params.trdr_retailer) {
                whereClause += " AND c.TRDR_RETAILER = :" + (queryParams.length + 1);
                queryParams.push(params.trdr_retailer);
            }
            
            // Filter by client
            if (params.trdr_client) {
                whereClause += " AND c.TRDR_CLIENT = :" + (queryParams.length + 1);
                queryParams.push(params.trdr_client);
            }
        }
        
        // Build full query
        var query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
                   "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
                   "r.NAME as retailerName, cl.NAME as clientName " +
                   "FROM CCCSFTP c " +
                   "LEFT JOIN TRDR r ON r.COMPANY = :1 AND r.TRDR = c.TRDR_RETAILER " +
                   "LEFT JOIN TRDR cl ON cl.COMPANY = :1 AND cl.TRDR = c.TRDR_CLIENT " +
                   "WHERE 1=1" + whereClause +
                   " ORDER BY r.NAME, cl.NAME";
        
        // Execute query
        var ds = X.GETSQLDATASET(query, queryParams);
        
        // Convert dataset to JSON for response
        var result = [];
        ds.FIRST;
        while (!ds.EOF) {
            // Create connector object
            var connector = {
                id: ds.id,
                cccsftp: ds.CCCSFTP,
                trdr_retailer: ds.TRDR_RETAILER,
                trdr_client: ds.TRDR_CLIENT,
                url: ds.URL,
                port: ds.PORT,
                username: ds.USERNAME,
                passphrase: ds.PASSPHRASE,
                initialdirin: ds.INITIALDIRIN,
                initialdirout: ds.INITIALDIROUT,
                fingerprint: ds.FINGERPRINT,
                privatekey: ds.PRIVATEKEY,
                retailerName: ds.retailerName,
                clientName: ds.clientName
            };
            
            // Add to result array
            result.push(connector);
            ds.NEXT;
        }
        
        return {
            success: true,
            data: result,
            total: result.length
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving EDI connectors: " + e.message
        };
    }
}

/**
 * Gets a single EDI connector by ID
 * @param {Object} params Object with id property
 * @returns {Object} Single EDI connector with success/error information
 */
function getEdiConnector(params) {
    try {
        var id = params.id;
        
        // Validate ID
        if (!id) {
            return {
                success: false,
                message: "Connector ID is required"
            };
        }
        
        // Query connector by ID
        var query = "SELECT c.CCCSFTP as id, c.CCCSFTP, c.TRDR_RETAILER, c.TRDR_CLIENT, c.URL, c.PORT, " +
                   "c.USERNAME, c.PASSPHRASE, c.INITIALDIRIN, c.INITIALDIROUT, c.FINGERPRINT, c.PRIVATEKEY, " +
                   "r.NAME as retailerName, cl.NAME as clientName " +
                   "FROM CCCSFTP c " +
                   "LEFT JOIN TRDR r ON r.COMPANY = :1 AND r.TRDR = c.TRDR_RETAILER " +
                   "LEFT JOIN TRDR cl ON cl.COMPANY = :1 AND cl.TRDR = c.TRDR_CLIENT " +
                   "WHERE c.CCCSFTP = :2";
        
        var ds = X.GETSQLDATASET(query, X.SYS.COMPANY, id);
        
        // Check if connector exists
        if (ds.EOF) {
            return {
                success: false,
                message: "Connector with ID " + id + " not found"
            };
        }
        
        // Create connector object
        var connector = {
            id: ds.id,
            cccsftp: ds.CCCSFTP,
            trdr_retailer: ds.TRDR_RETAILER,
            trdr_client: ds.TRDR_CLIENT,
            url: ds.URL,
            port: ds.PORT,
            username: ds.USERNAME,
            passphrase: ds.PASSPHRASE,
            initialdirin: ds.INITIALDIRIN,
            initialdirout: ds.INITIALDIROUT,
            fingerprint: ds.FINGERPRINT,
            privatekey: ds.PRIVATEKEY,
            retailerName: ds.retailerName,
            clientName: ds.clientName
        };
        
        return {
            success: true,
            data: connector
        };
    } catch (e) {
        return {
            success: false,
            message: "Error retrieving EDI connector: " + e.message
        };
    }
}

/**
 * Checks if an EDI connector already exists for a retailer/client combination
 * @param {Object} params Object with TRDR_RETAILER and TRDR_CLIENT properties
 * @returns {Object} Object with exists flag and success/error information
 */
function checkEdiConnectorExists(params) {
    try {
        var retailerId = params.TRDR_RETAILER;
        var clientId = params.TRDR_CLIENT;
        
        // Validate input
        if (!retailerId || !clientId) {
            return {
                success: false,
                message: "Retailer ID and Client ID are required"
            };
        }
        
        // Query for existing connector
        var query = "SELECT COUNT(*) as cnt FROM CCCSFTP " +
                   "WHERE TRDR_RETAILER = :1 AND TRDR_CLIENT = :2";
        
        var count = X.SQL(query, retailerId, clientId);
        
        // Parse string result to number
        var exists = parseInt(count) > 0;
        
        return {
            success: true,
            exists: exists
        };
    } catch (e) {
        return {
            success: false,
            message: "Error checking if EDI connector exists: " + e.message
        };
    }
}

/**
 * Creates a new EDI connector
 * @param {Object} params Connector data
 * @returns {Object} Result with success/error information and new connector ID
 */
function createEdiConnector(params) {
    try {
        // Validate required fields
        if (!params.TRDR_RETAILER) {
            return { success: false, message: "TRDR_RETAILER is required" };
        }
        
        if (!params.TRDR_CLIENT) {
            return { success: false, message: "TRDR_CLIENT is required" };
        }
        
        if (!params.URL) {
            return { success: false, message: "URL is required" };
        }
        
        // Check if connector already exists
        var existsCheck = checkEdiConnectorExists({
            TRDR_RETAILER: params.TRDR_RETAILER,
            TRDR_CLIENT: params.TRDR_CLIENT
        });
        
        if (existsCheck.exists) {
            return {
                success: false,
                message: "EDI Connector already exists for retailer " + params.TRDR_RETAILER + 
                         " and client " + params.TRDR_CLIENT
            };
        }
        
        // Prepare insert statement
        var sqlInsert = "INSERT INTO CCCSFTP (TRDR_RETAILER, TRDR_CLIENT, URL, PORT, USERNAME, PASSPHRASE, " +
                       "INITIALDIRIN, INITIALDIROUT, FINGERPRINT, PRIVATEKEY) " +
                       "VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10); " +
                       "SELECT SCOPE_IDENTITY() AS new_id;";
        
        // Execute insert
        var newId = X.SQL(sqlInsert, 
            params.TRDR_RETAILER,
            params.TRDR_CLIENT,
            params.URL,
            params.PORT || null,
            params.USERNAME || '',
            params.PASSPHRASE || '',
            params.INITIALDIRIN || '',
            params.INITIALDIROUT || '',
            params.FINGERPRINT || null,
            params.PRIVATEKEY || null
        );
        
        // Return success with new ID
        return {
            success: true,
            message: "EDI Connector created successfully",
            id: parseInt(newId)
        };
    } catch (e) {
        return {
            success: false,
            message: "Error creating EDI connector: " + e.message
        };
    }
}

/**
 * Updates an existing EDI connector
 * @param {Object} params Connector data with CCCSFTP (id)
 * @returns {Object} Result with success/error information
 */
function updateEdiConnector(params) {
    try {
        // Validate ID
        if (!params.CCCSFTP) {
            return { success: false, message: "Connector ID is required" };
        }
        
        // Check if connector exists
        var query = "SELECT COUNT(*) as cnt FROM CCCSFTP WHERE CCCSFTP = :1";
        var count = X.SQL(query, params.CCCSFTP);
        
        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Connector with ID " + params.CCCSFTP + " not found"
            };
        }
        
        // Prepare update statement parts
        var setStatements = [];
        var sqlParams = [params.CCCSFTP]; // First parameter is always the ID
        
        // Add fields to update if they are provided
        if (params.URL !== undefined) {
            setStatements.push("URL = :" + (sqlParams.length + 1));
            sqlParams.push(params.URL);
        }
        
        if (params.PORT !== undefined) {
            setStatements.push("PORT = :" + (sqlParams.length + 1));
            sqlParams.push(params.PORT);
        }
        
        if (params.USERNAME !== undefined) {
            setStatements.push("USERNAME = :" + (sqlParams.length + 1));
            sqlParams.push(params.USERNAME);
        }
        
        if (params.PASSPHRASE !== undefined) {
            setStatements.push("PASSPHRASE = :" + (sqlParams.length + 1));
            sqlParams.push(params.PASSPHRASE);
        }
        
        if (params.INITIALDIRIN !== undefined) {
            setStatements.push("INITIALDIRIN = :" + (sqlParams.length + 1));
            sqlParams.push(params.INITIALDIRIN);
        }
        
        if (params.INITIALDIROUT !== undefined) {
            setStatements.push("INITIALDIROUT = :" + (sqlParams.length + 1));
            sqlParams.push(params.INITIALDIROUT);
        }
        
        if (params.FINGERPRINT !== undefined) {
            setStatements.push("FINGERPRINT = :" + (sqlParams.length + 1));
            sqlParams.push(params.FINGERPRINT);
        }
        
        if (params.PRIVATEKEY !== undefined) {
            setStatements.push("PRIVATEKEY = :" + (sqlParams.length + 1));
            sqlParams.push(params.PRIVATEKEY);
        }
        
        // If no fields to update, return success
        if (setStatements.length === 0) {
            return {
                success: true,
                message: "No fields to update"
            };
        }
        
        // Build and execute update statement
        var sqlUpdate = "UPDATE CCCSFTP SET " + setStatements.join(", ") + " WHERE CCCSFTP = :1";
        X.RUNSQL(sqlUpdate, sqlParams);
        
        return {
            success: true,
            message: "EDI Connector updated successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error updating EDI connector: " + e.message
        };
    }
}

/**
 * Deletes an EDI connector
 * @param {Object} params Object with id property
 * @returns {Object} Result with success/error information
 */
function deleteEdiConnector(params) {
    try {
        var id = params.id;
        
        // Validate ID
        if (!id) {
            return { success: false, message: "Connector ID is required" };
        }
        
        // Check if connector exists
        var query = "SELECT COUNT(*) as cnt FROM CCCSFTP WHERE CCCSFTP = :1";
        var count = X.SQL(query, id);
        
        if (parseInt(count) === 0) {
            return {
                success: false,
                message: "Connector with ID " + id + " not found"
            };
        }
        
        // Delete the connector
        var sqlDelete = "DELETE FROM CCCSFTP WHERE CCCSFTP = :1";
        X.RUNSQL(sqlDelete, id);
        
        return {
            success: true,
            message: "EDI Connector deleted successfully"
        };
    } catch (e) {
        return {
            success: false,
            message: "Error deleting EDI connector: " + e.message
        };
    }
}

/**
 * Stores a document in the system with routing based on GLN
 * @param {Object} params Document data with xmlContent, filename, provider, gln
 * @returns {Object} Result with success/error information
 */
function storeDocumentWithRouting(params) {
    try {
        var xmlContent = params.xmlContent;
        var filename = params.filename;
        var provider = params.provider;
        var gln = params.gln;
        
        // Validate required fields
        if (!xmlContent) {
            return { success: false, message: "XML content is required" };
        }
        
        if (!filename) {
            return { success: false, message: "Filename is required" };
        }
        
        if (!provider) {
            return { success: false, message: "Provider is required" };
        }
        
        if (!gln) {
            return { success: false, message: "GLN is required" };
        }
        
        // Find retailer and client based on GLN
        var glnQuery = "SELECT TRDR_RETAILER, TRDR_CLIENT FROM CCCEDIGLNMAPPINGS WHERE GLN = :1 AND ACTIVE = 1";
        var glnDs = X.GETSQLDATASET(glnQuery, gln);
        
        if (glnDs.EOF) {
            return {
                success: false,
                message: "No active retailer mapping found for GLN: " + gln
            };
        }
        
        var retailerId = glnDs.TRDR_RETAILER;
        var clientId = glnDs.TRDR_CLIENT;
        
        // Store document in CCCEDIRAWDOCUMENTS table
        var documentInsert = "INSERT INTO CCCEDIRAWDOCUMENTS (FILENAME, PROVIDER, RETAILER_ID, CLIENT_ID, " +
                            "CONTENT, CONTENT_TYPE, DOCUMENT_TYPE, PROCESS_STATUS) " +
                            "VALUES (:1, :2, :3, :4, :5, 'XML', 'ORDER', 'NEW'); " +
                            "SELECT SCOPE_IDENTITY() AS new_id;";
        
        var documentId = X.SQL(documentInsert, 
            filename,
            provider,
            retailerId,
            clientId,
            xmlContent
        );
        
        // Check routing settings
        var routingQuery = "SELECT PROCESS_IN_LEGACY FROM CCCEDIRETAILERROUTING WHERE TRDR_RETAILER = :1 AND ACTIVE = 1";
        var routingDs = X.GETSQLDATASET(routingQuery, retailerId);
        
        var processInLegacy = true;
        if (!routingDs.EOF) {
            processInLegacy = routingDs.PROCESS_IN_LEGACY === 1;
        }
        
        // Update document with routing decision
        var routingUpdate = "UPDATE CCCEDIRAWDOCUMENTS SET LEGACY_PROCESSING = :1 WHERE CCCEDIRAWDOCUMENTS = :2";
        X.RUNSQL(routingUpdate, processInLegacy ? 1 : 0, documentId);
        
        // Add entry to process monitor
        var monitorInsert = "INSERT INTO CCCEDIPROCESSMONITOR (DOCUMENT_ID, PROCESS_STEP, STEP_STATUS, MESSAGE, CREATED_BY) " +
                           "VALUES (:1, 'RECEIVED', 'SUCCESS', 'Document received and routed successfully', 'API')";
        X.RUNSQL(monitorInsert, documentId);
        
        return {
            success: true,
            message: "Document stored successfully",
            documentId: parseInt(documentId),
            retailerId: retailerId,
            clientId: clientId,
            processInLegacy: processInLegacy
        };
    } catch (e) {
        return {
            success: false,
            message: "Error storing document: " + e.message
        };
    }
}

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
export const ediConnectorPath = '/edi-connector'
export const ediConnectorMethods = ['find', 'get', 'create', 'patch', 'remove']

// For clients to use for type hinting
export const ediConnectorClient = (client) => {
  const connection = client.get(ediConnectorPath)
  return connection
}
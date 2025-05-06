// EDI Connectors Store Module
import { defineStore } from 'pinia'
import api from '@/api'

export const useConnectorsStore = defineStore('connectors', {
  state: () => ({
    connectors: [],
    loading: false,
    error: null,
    currentConnector: null
  }),
  
  getters: {
    getConnectorById: (state) => {
      return (id) => state.connectors.find(connector => connector.id === id)
    }
  },
  
  actions: {
    async fetchConnectors() {
      this.loading = true
      this.error = null
      
      try {
        // Call the edi-connector service to get the list of connectors
        const response = await api.service('edi-connector').find({
          query: {
            $sort: { retailerName: 1 }, // Sort by retailer name
            $limit: 100 // Limit the number of results
          }
        })
        
        // Map FTP connection data from response
        const connectors = Array.isArray(response.data) 
          ? response.data
          : (response.data ? [response.data] : [])
        
        this.connectors = connectors
        return connectors
      } catch (error) {
        console.error('Error fetching connectors:', error)
        this.error = error.message || 'Failed to load connectors'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async getConnector(id) {
      this.loading = true
      this.error = null
      
      try {
        const connector = await api.service('edi-connector').get(id)
        this.currentConnector = connector
        return connector
      } catch (error) {
        console.error(`Error fetching connector ${id}:`, error)
        this.error = error.message || 'Failed to load connector details'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async createConnector(connectorData) {
      this.loading = true
      this.error = null
      
      try {
        const newConnector = await api.service('edi-connector').create(connectorData)
        this.connectors.push(newConnector)
        return newConnector
      } catch (error) {
        console.error('Error creating connector:', error)
        this.error = error.message || 'Failed to create connector'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async updateConnector(connectorData) {
      this.loading = true
      this.error = null
      
      try {
        const updatedConnector = await api.service('edi-connector').patch(connectorData.id, connectorData)
        const index = this.connectors.findIndex(c => c.id === updatedConnector.id)
        if (index !== -1) {
          this.connectors.splice(index, 1, updatedConnector)
        }
        return updatedConnector
      } catch (error) {
        console.error(`Error updating connector ${connectorData.id}:`, error)
        this.error = error.message || 'Failed to update connector'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async removeConnector(id) {
      this.loading = true
      this.error = null
      
      try {
        await api.service('edi-connector').remove(id)
        this.connectors = this.connectors.filter(c => c.id !== id)
        return id
      } catch (error) {
        console.error(`Error removing connector ${id}:`, error)
        this.error = error.message || 'Failed to delete connector'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async testConnector(id) {
      this.loading = true
      this.error = null
      
      try {
        // Call a custom method on the service to test the connection
        const result = await api.service('edi-connector').patch(id, {
          $test: true
        })
        return result
      } catch (error) {
        console.error(`Error testing connector ${id}:`, error)
        this.error = error.message || 'Failed to test connector connection'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
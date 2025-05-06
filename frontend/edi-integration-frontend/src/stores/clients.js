// Clients Store Module
import { defineStore } from 'pinia'
import api from '@/api'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchClients() {
      this.loading = true
      this.error = null
      
      try {
        // Call the s1-adapter service to get the list of clients
        const response = await api.service('s1-adapter').find({
          query: {
            objectType: 'clients',
            $sort: { name: 1 },
            $limit: 100
          }
        })
        
        const clients = Array.isArray(response.data) 
          ? response.data
          : (response.data ? [response.data] : [])
        
        this.clients = clients
        return clients
      } catch (error) {
        console.error('Error fetching clients:', error)
        this.error = error.message || 'Failed to load clients'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    getClientById(id) {
      return this.clients.find(client => client.id === id)
    }
  }
})
// Retailers Store Module
import { defineStore } from 'pinia'
import api from '@/api'

export const useRetailersStore = defineStore('retailers', {
  state: () => ({
    retailers: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchRetailers() {
      this.loading = true
      this.error = null
      
      try {
        // Call the s1-adapter service to get the list of retailers
        const response = await api.service('s1-adapter').find({
          query: {
            objectType: 'retailers',
            $sort: { name: 1 },
            $limit: 100
          }
        })
        
        const retailers = Array.isArray(response.data) 
          ? response.data
          : (response.data ? [response.data] : [])
        
        this.retailers = retailers
        return retailers
      } catch (error) {
        console.error('Error fetching retailers:', error)
        this.error = error.message || 'Failed to load retailers'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    getRetailerById(id) {
      return this.retailers.find(retailer => retailer.id === id)
    }
  }
})
<template>
  <div class="connectors">
    <h1>Conectori EDI</h1>
    
    <div class="toolbar">
      <button class="btn btn-primary" @click="showAddForm">
        <i class="fas fa-plus"></i> Adaugă conector nou
      </button>
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Caută după retailer..."
          @input="filterConnectors"
        />
        <i class="fas fa-search"></i>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Se încarcă conectori...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="loadConnectors">Încearcă din nou</button>
    </div>
    
    <div v-else-if="filteredConnectors.length === 0" class="no-data">
      <i class="fas fa-database"></i>
      <p>Nu există conectori EDI configurați{{ searchQuery ? ' pentru căutarea efectuată' : '' }}</p>
    </div>
    
    <div v-else class="connectors-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Retailer</th>
            <th>Client</th>
            <th>Protocol</th>
            <th>URL/Host</th>
            <th>Port</th>
            <th>Director primire</th>
            <th>Director trimitere</th>
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="connector in filteredConnectors" :key="connector.id">
            <td>{{ connector.id }}</td>
            <td>{{ connector.retailerName }}</td>
            <td>{{ connector.clientName }}</td>
            <td>
              <span :class="['protocol-badge', getProtocolClass(connector.url)]">
                {{ getProtocolType(connector.url) }}
              </span>
            </td>
            <td>{{ getHost(connector.url) }}</td>
            <td>{{ connector.port || getDefaultPort(connector.url) }}</td>
            <td>{{ connector.initialdirin }}</td>
            <td>{{ connector.initialdirout }}</td>
            <td class="actions">
              <button class="btn-icon" @click="editConnector(connector)" title="Editează">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon" @click="confirmDelete(connector)" title="Șterge">
                <i class="fas fa-trash-alt"></i>
              </button>
              <button class="btn-icon" @click="testConnection(connector)" title="Testează conexiunea">
                <i class="fas fa-plug"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal for add/edit form -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editează conector' : 'Adaugă conector nou' }}</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <connector-form 
            :connector="currentConnector" 
            :isEditing="isEditing"
            @save="saveConnector"
            @cancel="closeModal"
          />
        </div>
      </div>
    </div>
    
    <!-- Confirmation modal for delete -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-container delete-confirm">
        <div class="modal-header">
          <h2>Confirmare ștergere</h2>
          <button class="btn-close" @click="cancelDelete">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Sunteți sigur că doriți să ștergeți conectorul pentru 
            <strong>{{ connectorToDelete?.retailerName }}</strong>?
          </p>
          <div class="confirmation-actions">
            <button class="btn btn-secondary" @click="cancelDelete">Anulează</button>
            <button class="btn btn-danger" @click="deleteConnector">Șterge</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast notifications -->
    <div v-if="notification.show" :class="['toast', notification.type]">
      <div class="toast-content">
        <i :class="getNotificationIcon()"></i>
        <div class="toast-message">{{ notification.message }}</div>
      </div>
      <div class="toast-progress" :style="{ width: `${notification.progress}%` }"></div>
    </div>
  </div>
</template>

<script>
import { useConnectorsStore } from '@/stores/connectors';
import { storeToRefs } from 'pinia';
import ConnectorForm from '@/components/ConnectorForm.vue';

export default {
  name: 'ConnectorsView',
  components: {
    ConnectorForm
  },
  data() {
    return {
      searchQuery: '',
      filteredConnectors: [],
      showModal: false,
      isEditing: false,
      currentConnector: null,
      showDeleteConfirm: false,
      connectorToDelete: null,
      notification: {
        show: false,
        message: '',
        type: 'success',
        progress: 100,
        timeout: null
      }
    };
  },
  setup() {
    const connectorsStore = useConnectorsStore();
    const { connectors, loading, error } = storeToRefs(connectorsStore);
    
    return {
      connectorsStore,
      connectors,
      loading,
      error
    };
  },
  created() {
    this.loadConnectors();
  },
  methods: {
    async loadConnectors() {
      try {
        await this.connectorsStore.fetchConnectors();
        this.filterConnectors();
      } catch (error) {
        this.showNotification('Eroare la încărcarea conectorilor EDI', 'error');
      }
    },
    
    filterConnectors() {
      if (!this.searchQuery.trim()) {
        this.filteredConnectors = [...this.connectors];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      this.filteredConnectors = this.connectors.filter(connector => {
        return connector.retailerName.toLowerCase().includes(query) ||
               connector.clientName.toLowerCase().includes(query) ||
               connector.url.toLowerCase().includes(query);
      });
    },
    
    getProtocolType(url) {
      if (!url) return 'Unknown';
      
      if (url.startsWith('sftp://')) return 'SFTP';
      if (url.startsWith('ftp://')) return 'FTP';
      if (url.startsWith('http://')) return 'HTTP';
      if (url.startsWith('https://')) return 'HTTPS';
      
      // If no prefix, try to determine from host name
      if (url.includes('doc-process')) return 'SFTP';
      if (url.includes('infinite')) return 'FTP';
      
      return 'FTP';
    },
    
    getProtocolClass(url) {
      const protocol = this.getProtocolType(url);
      return protocol.toLowerCase();
    },
    
    getHost(url) {
      if (!url) return '';
      
      // Remove protocol prefix
      let host = url.replace(/^(sftp|ftp|https?):\/\//, '');
      
      // Remove any path or query string
      host = host.split('/')[0];
      host = host.split('?')[0];
      
      return host;
    },
    
    getDefaultPort(url) {
      const protocol = this.getProtocolType(url);
      
      switch (protocol) {
        case 'SFTP': return 22;
        case 'FTP': return 21;
        case 'HTTP': return 80;
        case 'HTTPS': return 443;
        default: return '-';
      }
    },
    
    showAddForm() {
      this.isEditing = false;
      this.currentConnector = {
        trdr_retailer: null,
        trdr_client: null,
        url: '',
        port: null,
        username: '',
        passphrase: '',
        initialdirin: '',
        initialdirout: '',
        fingerprint: '',
        privatekey: ''
      };
      this.showModal = true;
    },
    
    editConnector(connector) {
      this.isEditing = true;
      this.currentConnector = { ...connector };
      this.showModal = true;
    },
    
    async saveConnector(connector) {
      try {
        if (this.isEditing) {
          await this.connectorsStore.updateConnector(connector);
          this.showNotification('Conectorul a fost actualizat cu succes', 'success');
        } else {
          await this.connectorsStore.createConnector(connector);
          this.showNotification('Conectorul a fost adăugat cu succes', 'success');
        }
        
        this.closeModal();
        this.loadConnectors();
      } catch (error) {
        const action = this.isEditing ? 'actualizarea' : 'adăugarea';
        this.showNotification(`Eroare la ${action} conectorului EDI`, 'error');
      }
    },
    
    confirmDelete(connector) {
      this.connectorToDelete = connector;
      this.showDeleteConfirm = true;
    },
    
    cancelDelete() {
      this.showDeleteConfirm = false;
      this.connectorToDelete = null;
    },
    
    async deleteConnector() {
      try {
        await this.connectorsStore.removeConnector(this.connectorToDelete.id);
        this.showNotification('Conectorul a fost șters cu succes', 'success');
        this.cancelDelete();
        this.loadConnectors();
      } catch (error) {
        this.showNotification('Eroare la ștergerea conectorului EDI', 'error');
        this.cancelDelete();
      }
    },
    
    async testConnection(connector) {
      try {
        const result = await this.connectorsStore.testConnector(connector.id);
        
        if (result.success) {
          this.showNotification('Conexiune testată cu succes', 'success');
        } else {
          this.showNotification(`Eroare la testarea conexiunii: ${result.message}`, 'error');
        }
      } catch (error) {
        this.showNotification('Eroare la testarea conexiunii', 'error');
      }
    },
    
    closeModal() {
      this.showModal = false;
      this.currentConnector = null;
    },
    
    showNotification(message, type = 'success') {
      // Clear any existing timeout
      if (this.notification.timeout) {
        clearTimeout(this.notification.timeout);
      }
      
      // Set notification details
      this.notification = {
        show: true,
        message,
        type,
        progress: 100,
        timeout: null
      };
      
      // Start progress bar animation
      const duration = 5000; // 5 seconds
      const interval = 50; // Update every 50ms
      const step = 100 / (duration / interval);
      
      let progress = 100;
      const timer = setInterval(() => {
        progress -= step;
        
        if (progress <= 0) {
          clearInterval(timer);
          this.notification.show = false;
        } else {
          this.notification.progress = progress;
        }
      }, interval);
      
      // Auto hide after duration
      this.notification.timeout = setTimeout(() => {
        this.notification.show = false;
        clearInterval(timer);
      }, duration);
    },
    
    getNotificationIcon() {
      switch (this.notification.type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': return 'fas fa-info-circle';
        default: return 'fas fa-bell';
      }
    }
  }
};
</script>

<style scoped>
.connectors {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 24px;
  color: #333;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
}

.btn-primary:hover {
  background-color: #3d8b40;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box input {
  width: 100%;
  padding: 8px 16px 8px 36px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.connectors-table {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f5f5f5;
}

th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #eee;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  color: #666;
}

tr:hover {
  background-color: #f9f9f9;
}

.protocol-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.sftp {
  background-color: #e3f2fd;
  color: #1976d2;
}

.ftp {
  background-color: #fff8e1;
  color: #ff8f00;
}

.http {
  background-color: #e8f5e9;
  color: #388e3c;
}

.https {
  background-color: #e8eaf6;
  color: #3949ab;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background-color: transparent;
}

.btn-icon:hover {
  background-color: #f0f0f0;
}

.btn-icon i {
  font-size: 1rem;
}

.fa-edit {
  color: #2196f3;
}

.fa-trash-alt {
  color: #f44336;
}

.fa-plug {
  color: #4caf50;
}

.loading-container, .error-container, .no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container i, .no-data i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #f44336;
}

.no-data i {
  color: #9e9e9e;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.delete-confirm {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex-grow: 1;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* Toast notifications */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  min-width: 300px;
  max-width: 500px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-radius: 8px;
  z-index: 1000;
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
}

.toast i {
  font-size: 24px;
}

.success i {
  color: #4caf50;
}

.error i {
  color: #f44336;
}

.warning i {
  color: #ff9800;
}

.info i {
  color: #2196f3;
}

.toast-message {
  flex-grow: 1;
  font-size: 0.9rem;
}

.toast-progress {
  height: 4px;
  background: #4caf50;
}

.success .toast-progress {
  background: #4caf50;
}

.error .toast-progress {
  background: #f44336;
}

.warning .toast-progress {
  background: #ff9800;
}

.info .toast-progress {
  background: #2196f3;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .search-box {
    width: 100%;
  }
  
  .connectors-table {
    font-size: 0.9rem;
  }
  
  th, td {
    padding: 8px 12px;
  }
}
</style>
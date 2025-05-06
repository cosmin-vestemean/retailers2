<template>
  <form @submit.prevent="submitForm" class="connector-form">
    <div class="form-grid">
      <!-- Company selection section -->
      <div class="form-section">
        <h3>Asocieri companii</h3>
        
        <div class="form-group">
          <label for="retailer">Retailer <span class="required">*</span></label>
          <div class="select-wrapper">
            <select 
              id="retailer" 
              v-model="formData.trdr_retailer"
              required
              :disabled="isEditing"
              @change="onRetailerChange"
            >
              <option value="" disabled>Selectează un retailer</option>
              <option v-for="retailer in retailers" :key="retailer.id" :value="retailer.id">
                {{ retailer.name }}
              </option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div v-if="errors.trdr_retailer" class="error-message">
            {{ errors.trdr_retailer }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="client">Client <span class="required">*</span></label>
          <div class="select-wrapper">
            <select 
              id="client" 
              v-model="formData.trdr_client"
              required
              :disabled="isEditing"
            >
              <option value="" disabled>Selectează un client</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }}
              </option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div v-if="errors.trdr_client" class="error-message">
            {{ errors.trdr_client }}
          </div>
        </div>
      </div>
      
      <!-- Connection details section -->
      <div class="form-section">
        <h3>Detalii conexiune</h3>
        
        <div class="form-group">
          <label for="protocol">Protocol <span class="required">*</span></label>
          <div class="select-wrapper">
            <select 
              id="protocol" 
              v-model="selectedProtocol"
              required
              @change="updateUrlWithProtocol"
            >
              <option value="ftp">FTP</option>
              <option value="sftp">SFTP</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        
        <div class="form-group">
          <label for="host">Host/URL <span class="required">*</span></label>
          <input 
            type="text" 
            id="url" 
            v-model="formData.url"
            required
            placeholder="Exemplu: ftp.retailer-name.com"
            @blur="validateUrl"
          >
          <div v-if="errors.url" class="error-message">
            {{ errors.url }}
          </div>
          <div class="field-hint">
            Introduceți doar numele host-ului, fără protocol (ftp://, etc.)
          </div>
        </div>
        
        <div class="form-group">
          <label for="port">Port</label>
          <input 
            type="number" 
            id="port" 
            v-model.number="formData.port"
            placeholder="21"
          >
          <div class="field-hint">
            Implicit: FTP (21), SFTP (22), HTTP (80), HTTPS (443)
          </div>
        </div>
      </div>
    </div>
    
    <!-- Authentication section -->
    <div class="form-section">
      <h3>Autentificare</h3>
      
      <div class="form-group">
        <label for="username">Nume utilizator <span class="required">*</span></label>
        <input 
          type="text" 
          id="username" 
          v-model="formData.username"
          required
          placeholder="Introduceți numele de utilizator"
        >
      </div>
      
      <div class="form-group">
        <label for="passphrase">
          {{ selectedProtocol === 'sftp' ? 'Frază de acces / Parolă' : 'Parolă' }}
          <span class="required">*</span>
        </label>
        <div class="password-input">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            id="passphrase" 
            v-model="formData.passphrase"
            required
            placeholder="Introduceți parola"
          >
          <button type="button" class="toggle-password" @click="togglePasswordVisibility">
            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
      </div>
      
      <div v-if="selectedProtocol === 'sftp'" class="form-group">
        <label for="fingerprint">Amprentă (Fingerprint)</label>
        <input 
          type="text" 
          id="fingerprint" 
          v-model="formData.fingerprint"
          placeholder="ssh-rsa 2048 ABCDEF123456..."
        >
        <div class="field-hint">
          Amprenta criptografică a serverului (opțional, dar recomandat pentru securitate).
        </div>
      </div>
      
      <div v-if="selectedProtocol === 'sftp'" class="form-group">
        <label for="privatekey">Cheie privată (opțional)</label>
        <textarea 
          id="privatekey" 
          v-model="formData.privatekey"
          placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
          rows="6"
        ></textarea>
        <div class="field-hint">
          Cheie privată în format OpenSSH. Dacă este furnizată, va fi utilizată pentru autentificare în locul parolei.
        </div>
      </div>
    </div>
    
    <!-- Directory paths section -->
    <div class="form-section">
      <h3>Căi fișiere</h3>
      
      <div class="form-group">
        <label for="initialdirin">Director primire (input/descărcare) <span class="required">*</span></label>
        <input 
          type="text" 
          id="initialdirin" 
          v-model="formData.initialdirin"
          required
          placeholder="/in sau /download"
        >
        <div class="field-hint">
          Calea de unde vor fi descărcate fișierele XML.
        </div>
      </div>
      
      <div class="form-group">
        <label for="initialdirout">Director trimitere (output/încărcare) <span class="required">*</span></label>
        <input 
          type="text" 
          id="initialdirout" 
          v-model="formData.initialdirout"
          required
          placeholder="/out sau /upload"
        >
        <div class="field-hint">
          Calea unde vor fi încărcate fișierele generate.
        </div>
      </div>
    </div>
    
    <!-- Form actions -->
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Anulează</button>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting">
          <i class="fas fa-spinner fa-spin"></i> Se procesează...
        </span>
        <span v-else>
          {{ isEditing ? 'Actualizează' : 'Adaugă' }} conector
        </span>
      </button>
    </div>
  </form>
</template>

<script>
import { useRetailersStore } from '@/stores/retailers';
import { useClientsStore } from '@/stores/clients';
import { storeToRefs } from 'pinia';

export default {
  name: 'ConnectorForm',
  props: {
    connector: {
      type: Object,
      default: () => ({
        id: null,
        trdr_retailer: '',
        trdr_client: '',
        url: '',
        port: null,
        username: '',
        passphrase: '',
        initialdirin: '',
        initialdirout: '',
        fingerprint: '',
        privatekey: ''
      })
    },
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const retailersStore = useRetailersStore();
    const clientsStore = useClientsStore();
    
    const { retailers } = storeToRefs(retailersStore);
    const { clients } = storeToRefs(clientsStore);
    
    return {
      retailers,
      clients,
      retailersStore,
      clientsStore
    };
  },
  data() {
    return {
      formData: {
        id: null,
        trdr_retailer: '',
        trdr_client: '',
        url: '',
        port: null,
        username: '',
        passphrase: '',
        initialdirin: '',
        initialdirout: '',
        fingerprint: '',
        privatekey: ''
      },
      selectedProtocol: 'ftp',
      showPassword: false,
      isSubmitting: false,
      errors: {},
      protocolPortMap: {
        ftp: 21,
        sftp: 22,
        http: 80,
        https: 443
      }
    };
  },
  watch: {
    connector: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // Deep copy to avoid mutating props
          this.formData = JSON.parse(JSON.stringify(newVal));
          
          // Extract protocol from URL
          if (this.formData.url) {
            const urlLower = this.formData.url.toLowerCase();
            if (urlLower.startsWith('ftp://')) {
              this.selectedProtocol = 'ftp';
              this.formData.url = this.formData.url.substring(6);
            } else if (urlLower.startsWith('sftp://')) {
              this.selectedProtocol = 'sftp';
              this.formData.url = this.formData.url.substring(7);
            } else if (urlLower.startsWith('http://')) {
              this.selectedProtocol = 'http';
              this.formData.url = this.formData.url.substring(7);
            } else if (urlLower.startsWith('https://')) {
              this.selectedProtocol = 'https';
              this.formData.url = this.formData.url.substring(8);
            } else if (urlLower.includes('doc-process')) {
              this.selectedProtocol = 'sftp';
            } else if (urlLower.includes('infinite')) {
              this.selectedProtocol = 'ftp';
            }
          }
          
          // If no port is specified, set default based on protocol
          if (!this.formData.port && this.selectedProtocol) {
            this.formData.port = this.protocolPortMap[this.selectedProtocol];
          }
        }
      }
    }
  },
  created() {
    this.loadRetailers();
    this.loadClients();
  },
  methods: {
    async loadRetailers() {
      try {
        await this.retailersStore.fetchRetailers();
      } catch (error) {
        console.error('Failed to load retailers:', error);
      }
    },
    
    async loadClients() {
      try {
        await this.clientsStore.fetchClients();
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    },
    
    onRetailerChange() {
      // Set default folders based on retailer selection
      const retailer = this.retailers.find(r => r.id === this.formData.trdr_retailer);
      
      if (retailer) {
        if (retailer.name.toLowerCase().includes('doc-process')) {
          this.selectedProtocol = 'sftp';
          this.formData.port = 22;
          this.formData.initialdirin = '/in';
          this.formData.initialdirout = '/out';
        } else if (retailer.name.toLowerCase().includes('infinite')) {
          this.selectedProtocol = 'ftp';
          this.formData.port = 21;
          this.formData.initialdirin = '/upload';
          this.formData.initialdirout = '/download';
        }
        
        this.updateUrlWithProtocol();
      }
    },
    
    validateUrl() {
      const { url } = this.formData;
      
      if (!url) {
        this.errors.url = 'URL-ul este obligatoriu';
        return false;
      }
      
      // Check for protocol in URL, if present, extract it
      if (url.includes('://')) {
        const parts = url.split('://');
        const protocol = parts[0].toLowerCase();
        
        if (['ftp', 'sftp', 'http', 'https'].includes(protocol)) {
          this.selectedProtocol = protocol;
          this.formData.url = parts[1];
        } else {
          this.errors.url = 'Protocol de conexiune nerecunoscut';
          return false;
        }
      }
      
      this.errors.url = '';
      return true;
    },
    
    updateUrlWithProtocol() {
      // Make sure URL doesn't already have a protocol
      const cleanUrl = this.formData.url.replace(/^(ftp|sftp|https?):\/\//, '');
      this.formData.url = cleanUrl;

      // Update port based on selected protocol
      if (!this.formData.port || this.formData.port === this.protocolPortMap[this.selectedProtocol !== this.newProtocol]) {
        this.formData.port = this.protocolPortMap[this.selectedProtocol];
      }
    },
    
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    
    validateForm() {
      this.errors = {};
      let isValid = true;
      
      // Required fields validation
      if (!this.formData.trdr_retailer) {
        this.errors.trdr_retailer = 'Selectarea retailer-ului este obligatorie';
        isValid = false;
      }
      
      if (!this.formData.trdr_client) {
        this.errors.trdr_client = 'Selectarea clientului este obligatorie';
        isValid = false;
      }
      
      if (!this.validateUrl()) {
        isValid = false;
      }
      
      return isValid;
    },
    
    async submitForm() {
      if (!this.validateForm()) {
        return;
      }
      
      try {
        this.isSubmitting = true;
        
        // Add protocol to URL
        const finalData = {
          ...this.formData,
          url: `${this.selectedProtocol}://${this.formData.url}`
        };
        
        // Emit save event with form data
        this.$emit('save', finalData);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        this.isSubmitting = false;
      }
    },
    
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.connector-form {
  max-width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-section {
  margin-bottom: 24px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

h3 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.required {
  color: #f44336;
}

input, select, textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: #4caf50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.field-hint {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #777;
}

.error-message {
  color: #f44336;
  font-size: 0.8rem;
  margin-top: 4px;
}

.select-wrapper {
  position: relative;
}

.select-wrapper i {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
  pointer-events: none;
}

select {
  appearance: none;
  padding-right: 30px;
  background-color: white;
  cursor: pointer;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
}

textarea {
  resize: vertical;
  min-height: 100px;
  font-family: monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
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

.btn-primary:hover:not(:disabled) {
  background-color: #3d8b40;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
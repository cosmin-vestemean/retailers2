// This is a skeleton for a custom service class. Remove or add the methods you need here
import { MemoryService } from '@feathersjs/memory' // Import MemoryService

// Extend MemoryService instead of defining a custom class from scratch
export class UserService extends MemoryService {
  // The methods (find, get, create, patch, remove) are now inherited from MemoryService
  // You can add custom methods or override existing ones here if needed later
}

export const getOptions = (app) => {
  return {
    // Options for MemoryService
    paginate: app.get('paginate'), // Use pagination settings from config
    multi: true // Allow multiple record changes
    // You might add other MemoryService options here
  }
}

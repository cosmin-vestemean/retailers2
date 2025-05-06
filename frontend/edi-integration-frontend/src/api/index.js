// API service for connecting to Feathers.js backend
import io from 'socket.io-client';
import { feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import auth from '@feathersjs/authentication-client';

// API base URL - connects to the FeathersJS middleware server
const socket = io('http://localhost:3030', {
  transports: ['websocket'],
  forceNew: true
});

// Configure the Feathers client
const api = feathers()
  .configure(socketio(socket))
  .configure(auth());

// Export the configured Feathers client
export default api;
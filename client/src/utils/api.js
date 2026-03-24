import axios from 'axios';

const api = axios.create({
  baseURL: '',  // relative — works both locally and on Railway
  withCredentials: true,
});

export default api;

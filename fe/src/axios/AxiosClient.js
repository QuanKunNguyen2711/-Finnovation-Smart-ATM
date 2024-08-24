import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
});

axiosInstance.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axiosInstance.interceptors.request.use(
    config => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );


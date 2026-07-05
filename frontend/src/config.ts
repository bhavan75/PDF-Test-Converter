// Centralized configuration for the PDF Test Converter Frontend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://pdf-test-converter.onrender.com');

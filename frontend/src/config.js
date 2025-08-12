// Environment Configuration
const config = {
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '64236727812-mibhjqn5hkrq51efv23q3pl4g8l2pnlq.apps.googleusercontent.com',
  
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // App Configuration
  APP_NAME: 'Media Gallery',
  APP_VERSION: '1.0.0'
};

// Validate required environment variables
const requiredEnvVars = ['REACT_APP_GOOGLE_CLIENT_ID'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing environment variable: ${envVar}`);
  }
});

export default config; 
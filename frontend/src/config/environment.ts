// Environment configuration service
// This provides type-safe access to environment variables

export type Environment = 'DEV' | 'PROD';

export interface EnvironmentConfig {
  // Environment
  environment: Environment;
  
  // Cloud Functions Configuration
  cloudFunctions: {
    endpoint: string;
    region: string;
  };
  
  // Firebase Auth Configuration
  firebaseAuth: {
    endpoint: string;
  };
  
  // Firebase Storage Configuration
  firebaseStorage: {
    endpoint: string;
  };
  
  // Google Maps Configuration
  googleMaps: {
    apiKey: string;
  };
  
  // App Configuration
  app: {
    enableAnalytics: boolean;
    enableDebugLogging: boolean;
  };
}

// Environment-specific configurations
const environmentConfigs: Record<Environment, Partial<EnvironmentConfig>> = {
  DEV: {
    cloudFunctions: {
      endpoint: 'http://localhost:5001/th-stray/asia-northeast1',
      region: 'asia-northeast1',
    },
    firebaseAuth: {
      endpoint: 'http://localhost:9099',
    },
    firebaseStorage: {
      endpoint: 'http://localhost:9199',
    },
    app: {
      enableAnalytics: false,
      enableDebugLogging: true,
    },
  },
  PROD: {
    cloudFunctions: {
      endpoint: 'https://asia-northeast1-th-stray.cloudfunctions.net',
      region: 'asia-northeast1',
    },
    firebaseAuth: {
      endpoint: 'https://identitytoolkit.googleapis.com',
    },
    firebaseStorage: {
      endpoint: 'https://firebasestorage.googleapis.com',
    },
    app: {
      enableAnalytics: true,
      enableDebugLogging: false,
    },
  },
};

// Validate and load environment variables
function loadEnvironmentConfig(): EnvironmentConfig {
  // Get environment from RUN_ENV or default to DEV
  const runEnv = (import.meta.env.VITE_RUN_ENV as Environment) || 'DEV';
  
  // Get base config for the environment
  const baseConfig = environmentConfigs[runEnv];
  
  const config: EnvironmentConfig = {
    environment: runEnv,
    
    cloudFunctions: {
      endpoint: baseConfig.cloudFunctions?.endpoint || 'http://localhost:5001/th-stray/asia-northeast1',
      region: baseConfig.cloudFunctions?.region || 'asia-northeast1',
    },
    
    firebaseAuth: {
      endpoint: baseConfig.firebaseAuth?.endpoint || '',
    },
    
    firebaseStorage: {
      endpoint: baseConfig.firebaseStorage?.endpoint || '',
    },
    
    googleMaps: {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    },
    
    app: {
      enableAnalytics: baseConfig.app?.enableAnalytics ?? false,
      enableDebugLogging: baseConfig.app?.enableDebugLogging ?? true,
    },
  };

  // Validate required configuration
  validateConfig(config);
  
  return config;
}

function validateConfig(config: EnvironmentConfig): void {
  const errors: string[] = [];
  
  // Validate Google Maps config
  if (!config.googleMaps.apiKey) errors.push('VITE_GOOGLE_MAPS_KEY is required');
  
  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join('\n')}`);
  }
}

// Export the configuration
export const env = loadEnvironmentConfig();

// Helper functions
export const isDev = env.environment === 'DEV';
export const isProd = env.environment === 'PROD';

export const isLocalEmulator = isDev && env.cloudFunctions.endpoint.includes('localhost');

// Log configuration in development
if (env.app.enableDebugLogging) {
  console.log('🔧 Environment Configuration:', {
    environment: env.environment,
    cloudFunctionsEndpoint: env.cloudFunctions.endpoint,
    firebaseAuthEndpoint: env.firebaseAuth.endpoint,
    firebaseStorageEndpoint: env.firebaseStorage.endpoint,
    isLocalEmulator,
    enableAnalytics: env.app.enableAnalytics,
    enableDebugLogging: env.app.enableDebugLogging,
  });
} 
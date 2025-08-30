export const config = {
  // Database
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // AI Video Generation
  kie: {
    apiUrl: process.env.KIE_API_URL || 'https://api.kie.com',
    apiKey: process.env.KIE_API_KEY!,
  },

  // File Storage
  r2: {
    endpoint: process.env.R2_ENDPOINT!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
    publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL!,
  },

  // Payment
  creem: {
    apiKey: process.env.CREEM_API_KEY!,
    environment: (process.env.CREEM_ENVIRONMENT as 'test' | 'production') || 'test',
    publishableKey: process.env.NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY!,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Application
  app: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET!,
  },

  // Rate Limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  },

  // Email (Optional)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Analytics (Optional)
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    vercelAnalyticsId: process.env.VERCEL_ANALYTICS_ID,
  },

  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required environment variables
export function validateConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}
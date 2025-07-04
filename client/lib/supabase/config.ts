interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface EnvironmentConfig {
  development: SupabaseConfig;
  production: SupabaseConfig;
}

export function getSupabaseConfig(): SupabaseConfig {
  const nodeEnv = process.env.NODE_APP_ENV || 'development';
  
  const config: EnvironmentConfig = {
    development: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    production: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  };

  // Validate that we have the required configuration
  const selectedConfig = config[nodeEnv as keyof EnvironmentConfig];
  
  if (!selectedConfig) {
    throw new Error(`Invalid NODE_APP_ENV: ${nodeEnv}. Must be 'development' or 'production'.`);
  }

  if (!selectedConfig.url || !selectedConfig.anonKey) {
    throw new Error(`Missing Supabase configuration for environment: ${nodeEnv}`);
  }

  console.log(`🔧 Using Supabase config for: ${nodeEnv}`);
  console.log(`📍 Supabase URL: ${selectedConfig.url.substring(0, 30)}...`);

  return selectedConfig;
}

export const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig(); 
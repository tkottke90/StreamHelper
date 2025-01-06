const ENVIRONMENT_VARIABLES = {
  PORT: {
    factory: Number,
    defaultValue: 5000
  }
};

export class EnvironmentService {
  getEnv<T>(key: string, defaultValue: T) {}
}

const envCache: Record<string, string> = {};

export function loadEnv(key: string, defaultValue = '') {
  if (envCache[key]) {
    return envCache[key];
  }

  const env = process.env[key];

  if (env) {
    envCache[key] = env;
    return env;
  }

  return defaultValue;
}

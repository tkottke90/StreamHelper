const ENVIRONMENT_VARIABLES = {
  PORT: {
    factory: Number,
    defaultValue: 5000
  }
};

export class EnvironmentService {
  getEnv<T>(key: string, defaultValue: T) {}
}

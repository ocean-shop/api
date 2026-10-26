export const APP_ENVS = ['develop', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

export const DEFAULT_APP_ENV: AppEnv = 'develop';

// Browsers send the Origin header without a trailing slash, so entries here
// must not have one either or they will never match.
export const CORS_ORIGINS_BY_ENV: Readonly<Record<AppEnv, readonly string[]>> =
  {
    develop: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://admin-develop-a3d4.up.railway.app',
      'https://client-develop-dea1.up.railway.app',
    ],
    production: [
      'https://admin-production-90ee.up.railway.app',
      'https://client-production-cf61c.up.railway.app',
    ],
  };

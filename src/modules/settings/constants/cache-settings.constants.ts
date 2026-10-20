export const CACHE_SETTINGS_MESSAGES = {
  invalidationFailed: (reason: string): string =>
    `Не вдалося очистити кеш: ${reason}`,
} as const;

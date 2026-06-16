export function isEmailQueueEnabled(): boolean {
  return process.env.EMAIL_QUEUE_ENABLED === 'true';
}

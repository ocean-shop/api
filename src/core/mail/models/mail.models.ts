export type SendMailOptions = {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
};

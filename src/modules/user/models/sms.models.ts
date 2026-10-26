export type TurboSmsResponseItem = {
  message_id?: string | null;
  response_code?: number | string;
  response_status?: string;
};

export type TurboSmsResponse = {
  response_code?: number | string;
  response_status?: string;
  response_result?: TurboSmsResponseItem[];
};

/* Generated from shared/contracts; do not edit. */

export type Code = string;
export type Message = string;
export type RequestId = string;
export type Retryable = boolean;

export interface ApiError {
  error: ApiErrorDetail;
}
export interface ApiErrorDetail {
  code: Code;
  message: Message;
  request_id: RequestId;
  retryable: Retryable;
}

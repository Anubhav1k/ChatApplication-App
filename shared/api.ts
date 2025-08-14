/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for http://localhost:3001/api/demo
 */
export interface DemoResponse {
  message: string;
}

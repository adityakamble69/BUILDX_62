/**
 * Operational error with an API error code and HTTP status.
 * `errorHandler` reads `code`/`status`/`message`/`details` off it (rules.md §10).
 */
export class AppError extends Error {
  /**
   * @param {string} code    Machine-readable code, e.g. "UNAUTHORIZED".
   * @param {number} status  HTTP status.
   * @param {string} message Safe to show the user.
   * @param {unknown} [details] Extra structured info (e.g. Zod issues). Included in the response.
   */
  constructor(code, status, message, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

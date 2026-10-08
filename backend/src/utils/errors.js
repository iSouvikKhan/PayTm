/** An error whose message is safe to send to the client. */
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (message, details) => new AppError(400, message, details);
const unauthorized = (message = "Authentication required") => new AppError(401, message);
const notFound = (message = "Not found") => new AppError(404, message);
const conflict = (message) => new AppError(409, message);

module.exports = { AppError, badRequest, unauthorized, notFound, conflict };

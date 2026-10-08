const { unauthorized } = require("../utils/errors");

/** Requires `Authorization: Bearer <jwt>` and sets req.userId. */
function createAuthMiddleware(authService) {
  return (req, _res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return next(unauthorized());
    try {
      req.userId = authService.verifyToken(token);
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { createAuthMiddleware };

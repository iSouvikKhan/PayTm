const { badRequest } = require("../utils/errors");

/**
 * Validates req[source] with a Zod schema and stores the parsed value on req.valid[source].
 * Failures become a 400 with per-field messages.
 */
function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join(".") || null,
        message: i.message,
      }));
      const summary = details.map((d) => (d.field ? `${d.field} ${d.message}` : d.message)).join("; ");
      return next(badRequest(summary, details));
    }
    req.valid = { ...(req.valid ?? {}), [source]: result.data };
    return next();
  };
}

module.exports = { validate };

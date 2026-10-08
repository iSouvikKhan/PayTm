const { z } = require("zod");

// Load backend/.env if present (Node 20.12+). Real environment variables take precedence.
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required, e.g. mongodb://127.0.0.1:27017/paytm?replicaSet=rs0"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  // Starting balance for new accounts, in rupees: a random value in [min, max].
  SIGNUP_BONUS_MIN: z.coerce.number().min(0).default(1000),
  SIGNUP_BONUS_MAX: z.coerce.number().min(0).default(10000),
});

function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid configuration (see backend/.env.example):\n${problems}`);
  }
  if (parsed.data.SIGNUP_BONUS_MIN > parsed.data.SIGNUP_BONUS_MAX) {
    throw new Error("SIGNUP_BONUS_MIN cannot be greater than SIGNUP_BONUS_MAX");
  }
  return parsed.data;
}

module.exports = { loadConfig };

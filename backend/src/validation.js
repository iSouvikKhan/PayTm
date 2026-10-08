const { z } = require("zod");
const { MAX_TRANSFER_RUPEES, hasAtMostTwoDecimals } = require("./utils/money");

const name = z.string().trim().min(1, "is required").max(50, "must be at most 50 characters");
// bcrypt only uses the first 72 bytes of a password.
const password = z.string().min(8, "must be at least 8 characters").max(72, "must be at most 72 characters");
const email = z.string().trim().toLowerCase().pipe(z.email("must be a valid email address"));

const signupSchema = z.object({ username: email, password, firstName: name, lastName: name });

const signinSchema = z.object({
  username: email,
  password: z.string().min(1, "is required").max(72),
});

const updateProfileSchema = z
  .object({
    firstName: name.optional(),
    lastName: name.optional(),
    password: password.optional(),
    currentPassword: z.string().max(72).optional(),
  })
  .refine((b) => b.firstName !== undefined || b.lastName !== undefined || b.password !== undefined, {
    message: "Provide at least one of firstName, lastName or password",
  });

const searchSchema = z.object({ filter: z.string().max(50).optional().default("") });

const transferSchema = z.object({
  to: z.string().regex(/^[a-f\d]{24}$/i, "must be a valid user id"),
  amount: z.coerce
    .number({ error: "must be a number" })
    .positive("must be greater than zero")
    .max(MAX_TRANSFER_RUPEES, `cannot exceed ${MAX_TRANSFER_RUPEES} per transfer`)
    .refine(hasAtMostTwoDecimals, "can have at most two decimal places"),
  note: z.string().trim().max(140).optional(),
});

const historySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) });

module.exports = {
  signupSchema,
  signinSchema,
  updateProfileSchema,
  searchSchema,
  transferSchema,
  historySchema,
};

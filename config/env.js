const { z } = require("zod");

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatIssues(issues) {
  return issues.map((issue) => {
    const path = issue.path?.length ? issue.path.join(".") : "env";
    return `- ${path}: ${issue.message}`;
  });
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOCAL_DEV: z.string().optional().default("0"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    SESSION_SECRET: z.string().optional(),
    DATABASE_URL: z.string().url().optional().or(z.literal("")),
    REDIS_URL: z.string().url().optional().or(z.literal("")),
    REDIS_PRIVATE_URL: z.string().url().optional().or(z.literal("")),
    CAPTCHA_PROVIDER: z.enum(["none", "turnstile", "hcaptcha"]).default("none"),
    CAPTCHA_SITE_KEY: z.string().optional().default(""),
    CAPTCHA_SECRET_KEY: z.string().optional().default(""),
    ALLOWED_ORIGINS: z.string().optional().default(""),
    VAPID_PUBLIC_KEY: z.string().optional().default(""),
    VAPID_PRIVATE_KEY: z.string().optional().default(""),
    VAPID_EMAIL: z.string().optional().default("mailto:admin@example.com"),
  })
  .superRefine((env, ctx) => {
    const localDev = parseBoolean(env.LOCAL_DEV);
    const isProd = env.NODE_ENV === "production" && !localDev;
    const sessionSecret = sanitizeString(env.SESSION_SECRET);

    if (isProd && sessionSecret.length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "must be set to at least 16 characters in production",
      });
    }

    if (isProd && !sanitizeString(env.DATABASE_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "is required in production",
      });
    }

    if (env.CAPTCHA_PROVIDER !== "none") {
      if (!sanitizeString(env.CAPTCHA_SITE_KEY)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CAPTCHA_SITE_KEY"],
          message: `is required when CAPTCHA_PROVIDER=${env.CAPTCHA_PROVIDER}`,
        });
      }
      if (!sanitizeString(env.CAPTCHA_SECRET_KEY)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CAPTCHA_SECRET_KEY"],
          message: `is required when CAPTCHA_PROVIDER=${env.CAPTCHA_PROVIDER}`,
        });
      }
    }
  });

function validateAndApplyEnv(rawEnv = process.env) {
  const parsed = envSchema.safeParse({
    NODE_ENV: rawEnv.NODE_ENV,
    LOCAL_DEV: rawEnv.LOCAL_DEV,
    PORT: rawEnv.PORT,
    SESSION_SECRET: rawEnv.SESSION_SECRET,
    DATABASE_URL: rawEnv.DATABASE_URL,
    REDIS_URL: rawEnv.REDIS_URL,
    REDIS_PRIVATE_URL: rawEnv.REDIS_PRIVATE_URL,
    CAPTCHA_PROVIDER: sanitizeString(rawEnv.CAPTCHA_PROVIDER || "none").toLowerCase(),
    CAPTCHA_SITE_KEY: rawEnv.CAPTCHA_SITE_KEY,
    CAPTCHA_SECRET_KEY: rawEnv.CAPTCHA_SECRET_KEY,
    ALLOWED_ORIGINS: rawEnv.ALLOWED_ORIGINS,
    VAPID_PUBLIC_KEY: rawEnv.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: rawEnv.VAPID_PRIVATE_KEY,
    VAPID_EMAIL: rawEnv.VAPID_EMAIL,
  });

  if (!parsed.success) {
    const issues = formatIssues(parsed.error.issues).join("\n");
    throw new Error(`[startup] Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;
  const localDev = parseBoolean(env.LOCAL_DEV);
  const isDevMode = localDev || env.NODE_ENV === "development" || env.NODE_ENV === "test";
  const isProd = env.NODE_ENV === "production" && !localDev;
  const sessionSecret = sanitizeString(env.SESSION_SECRET);

  const normalized = {
    ...env,
    LOCAL_DEV: localDev,
    IS_DEV_MODE: isDevMode,
    IS_PROD: isProd,
    SESSION_SECRET: sessionSecret || (isDevMode ? "local-dev-session-secret" : ""),
    DATABASE_URL: sanitizeString(env.DATABASE_URL),
    REDIS_URL: sanitizeString(env.REDIS_URL),
    REDIS_PRIVATE_URL: sanitizeString(env.REDIS_PRIVATE_URL),
    CAPTCHA_SITE_KEY: sanitizeString(env.CAPTCHA_SITE_KEY),
    CAPTCHA_SECRET_KEY: sanitizeString(env.CAPTCHA_SECRET_KEY),
    ALLOWED_ORIGINS: sanitizeString(env.ALLOWED_ORIGINS),
    VAPID_PUBLIC_KEY: sanitizeString(env.VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: sanitizeString(env.VAPID_PRIVATE_KEY),
    VAPID_EMAIL: sanitizeString(env.VAPID_EMAIL) || "mailto:admin@example.com",
  };

  process.env.NODE_ENV = normalized.NODE_ENV;
  process.env.LOCAL_DEV = normalized.LOCAL_DEV ? "1" : "0";
  process.env.PORT = String(normalized.PORT);
  process.env.SESSION_SECRET = normalized.SESSION_SECRET;

  if (normalized.DATABASE_URL) process.env.DATABASE_URL = normalized.DATABASE_URL;
  else delete process.env.DATABASE_URL;

  return normalized;
}

module.exports = { validateAndApplyEnv };

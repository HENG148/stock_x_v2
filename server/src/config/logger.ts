import pino from "pino";
import { env, isProduction } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.header.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.password",
      "*.passwordHash",
      "*.token"
    ],
    censor: "[REDACTED]",
  },
  ...(isProduction || env.NODE_ENV === "test" ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } })
});
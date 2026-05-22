import pino from "pino";

const level = process.env.LOG_LEVEL?.trim() || "info";

/** Base structured logger used across gateway modules. */
export const logger = pino({
  level,
  base: undefined
});

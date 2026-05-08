import winston from "winston";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),

    winston.format.printf(
      ({ timestamp, level, message, stack, serviceName, ...meta }) => {

        let logBody = "";

        // =========================
        // SERVICE NAME
        // =========================
        const service = serviceName
          ? `[${serviceName}]`
          : "[UNKNOWN_SERVICE]";

        // =========================
        // ERROR WITH STACK
        // =========================
        if (stack) {
          logBody = `${timestamp} ${service} [${level}] ${message}\n${stack}`;
        }

        // =========================
        // OBJECT MESSAGE
        // =========================
        else if (typeof message === "object") {
          logBody = `${timestamp} ${service} [${level}] ${JSON.stringify(
            message,
            null,
            2
          )}`;
        }

        // =========================
        // NORMAL STRING MESSAGE
        // =========================
        else {
          logBody = `${timestamp} ${service} [${level}] ${message}`;
        }

        return `
----------------- LOGGER START -----------------
${logBody}
${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}
------------------ LOGGER END ------------------
`;
      }
    )
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error"
    }),

    new winston.transports.File({
      filename: "logs/combined.log"
    })
  ]
});

export default logger;
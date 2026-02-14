import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    // winston.format.json()
    winston.format.printf(({ timestamp, level, message, stack }) => {
      console.log("----------------- LOGGER ERROR RESPOSE START -----------------")
      if (stack) {
        return `${timestamp} [${level}] ${message}\n${stack}`;
      }

      if (typeof message === "object") {
        const { method, url, status, responseTime } = message as any;
        return `${timestamp} [${level}] ${method} ${url} ${status} ${responseTime} ms`;
      }

      return `${timestamp} [${level}] ${message}`;
    })
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
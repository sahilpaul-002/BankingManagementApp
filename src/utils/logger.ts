// import winston from "winston";

// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     // winston.format.json()
//     //   winston.format.printf(({ timestamp, level, message, stack }) => {
//     //     console.log("// ----------------- LOGGER RESPONSE START ----------------- \\")
//     //     if (stack) {
//     //       return `${timestamp} [${level}] ${message}\n${stack}`;
//     //     }

//     //     if (typeof message === "object") {
//     //       const { method, url, status, responseTime } = message as any;
//     //       return `${timestamp} [${level}] ${method} ${url} ${status} ${responseTime} ms`;
//     //     }

//     //     return `${timestamp} [${level}] ${message}`;
//     //   })
//     // ),
//     winston.format.printf(({ timestamp, level, message, stack }) => {

//       let logBody: string;

//       if (stack) {
//         logBody = `${timestamp} [${level}] ${message}\n${stack}`;
//       }
//       else if (typeof message === "object") {
//         const { method, url, status, responseTime } = message as any;
//         logBody = `${timestamp} [${level}] ${method} ${url} ${status} ${responseTime} ms`;
//       }
//       else {
//         logBody = `${timestamp} [${level}] ${message}`;
//       }

//       return `----------------- LOGGER RESPONSE START -----------------
// ${logBody}
// ------------------ LOGGER RESPONSE END ------------------
// `;
//     })),
//   transports: [
//     new winston.transports.Console(),

//     new winston.transports.File({
//       filename: "logs/error.log",
//       level: "SERVICE_ERROR"
//     }),

//     new winston.transports.File({
//       filename: "logs/combined.log"
//     })
//   ]
// });

// export default logger;

import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {

      let logBody: string;

      if (stack) {
        logBody = `${timestamp} [${level}] ${message}\n${stack}`;
      } else if (typeof message === "object") {
        logBody = `${timestamp} [${level}] ${JSON.stringify(message, null, 2)}`;
      } else {
        logBody = `${timestamp} [${level}] ${message}`;
      }

      return `----------------- LOGGER START -----------------
${logBody}
${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}
------------------ LOGGER END ------------------`;
    })
  ),
  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "SERVICE_ERROR"
    }),

    new winston.transports.File({
      filename: "logs/combined.log"
    })
  ]
});

export default logger;
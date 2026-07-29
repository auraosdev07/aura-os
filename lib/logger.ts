/**
 * lib/logger.ts
 *
 * Centralized structured logger for the application.
 * Currently writes to console, but abstracts it so we can pipe to an external service later.
 */

type LogLevel = "info" | "warn" | "error" | "debug" | "ai";

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    
    // In development, log cleanly. In production, this might be a JSON string.
    if (level === "error") {
      console.error(`[${timestamp}] [ERROR] ${message}`, data ? data : "");
    } else if (level === "warn") {
      console.warn(`[${timestamp}] [WARN] ${message}`, data ? data : "");
    } else if (level === "debug") {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[${timestamp}] [DEBUG] ${message}`, data ? data : "");
      }
    } else if (level === "ai") {
      console.info(`[${timestamp}] [AI] 🤖 ${message}`, data ? data : "");
    } else {
      console.info(`[${timestamp}] [INFO] ${message}`, data ? data : "");
    }
  }

  info(message: string, data?: unknown) { this.log("info", message, data); }
  warn(message: string, data?: unknown) { this.log("warn", message, data); }
  error(message: string, data?: unknown) { this.log("error", message, data); }
  debug(message: string, data?: unknown) { this.log("debug", message, data); }
  ai(message: string, data?: unknown) { this.log("ai", message, data); }
}

export const logger = new Logger();

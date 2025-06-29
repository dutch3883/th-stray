import { env } from '../config/environment';

// Logging levels enum
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Logging service configuration
interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTimestamp: boolean;
}

class LoggingService {
  private config: LoggingConfig;
  private readonly STORAGE_KEY = 'straycat_log_level';

  constructor() {
    const savedLevel = this.loadLogLevelFromStorage();
    
    this.config = {
      level: savedLevel,
      enableConsole: true,
      enableTimestamp: true
    };
  }

  // Load log level from localStorage or use environment-based default
  private loadLogLevelFromStorage(): LogLevel {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved !== null) {
        const level = parseInt(saved, 10);
        if (level >= LogLevel.ERROR && level <= LogLevel.DEBUG) {
          return level;
        }
      }
    } catch (error) {
      console.warn('Failed to load log level from localStorage:', error);
    }
    
    return env.app.enableDebugLogging ? LogLevel.DEBUG : LogLevel.INFO;
  }

  // Save log level to localStorage
  private saveLogLevelToStorage(level: LogLevel): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, level.toString());
    } catch (error) {
      console.warn('Failed to save log level to localStorage:', error);
    }
  }

  // Get current timestamp for logging
  private getTimestamp(): string {
    if (!this.config.enableTimestamp) return '';
    return `[${new Date().toISOString()}] `;
  }

  // Check if a log level should be displayed
  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  // Format log message
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    const envStr = `[${env.environment}]`;
    const levelStr = `[${level}]`;
    const baseMessage = `${timestamp}${envStr}${levelStr} ${message}`;
    
    if (data !== undefined) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  // Error level logging
  error(message: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('ERROR', message, data);
      if (this.config.enableConsole) {
        console.error(formattedMessage);
      }
    }
  }

  // Warn level logging
  warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage('WARN', message, data);
      if (this.config.enableConsole) {
        console.warn(formattedMessage);
      }
    }
  }

  // Info level logging
  info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage('INFO', message, data);
      if (this.config.enableConsole) {
        console.info(formattedMessage);
      }
    }
  }

  // Debug level logging
  debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage('DEBUG', message, data);
      if (this.config.enableConsole) {
        console.log(formattedMessage);
      }
    }
  }

  // Set log level dynamically
  setLevel(level: LogLevel) {
    this.config.level = level;
    this.saveLogLevelToStorage(level);
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.config.level;
  }

  // Reset log level to environment-based default
  resetLevel(): void {
    this.config.level = env.app.enableDebugLogging ? LogLevel.DEBUG : LogLevel.INFO;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear log level from localStorage:', error);
    }
  }
}

// Export singleton instance
export const logger = new LoggingService();

// Export convenience functions
export const logError = (message: string, data?: any) => logger.error(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data); 
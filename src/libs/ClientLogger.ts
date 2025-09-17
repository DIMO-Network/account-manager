class ClientLogger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  private async sendLog(level: string, message: string, data?: any) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  debug(message: string, data?: any) {
    if (this.logLevel === 'debug') {
      this.sendLog('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    this.sendLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.sendLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.sendLog('error', message, data);
  }
}

export const clientLogger = new ClientLogger();

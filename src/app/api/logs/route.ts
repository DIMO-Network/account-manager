import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/libs/Logger';

export async function POST(request: NextRequest) {
  try {
    const { level, message, data, timestamp, url, userAgent } = await request.json();

    // Log to server-side logger with structured data
    const logData = {
      message,
      data,
      timestamp,
      url,
      userAgent,
      source: 'client',
    };

    // Use appropriate log level method
    switch (level) {
      case 'debug':
        logger.debug(logData);
        break;
      case 'info':
        logger.info(logData);
        break;
      case 'warn':
        logger.warn(logData);
        break;
      case 'error':
        logger.error(logData);
        break;
      default:
        logger.info(logData);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to process client log');
    return NextResponse.json({ error: 'Failed to process log' }, { status: 500 });
  }
}

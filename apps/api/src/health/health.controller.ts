import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'infinix-pro-api',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}

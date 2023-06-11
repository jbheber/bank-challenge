import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Version,
} from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Version('1')
  @Get('ping')
  async ping() {
    // Endpoint only for non-prod
    if (['production', 'prod'].includes(process.env.NODE_ENV ?? '')) {
      throw new HttpException(
        'This endpoint is for debugging purposes only',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.healthService.checkDbConnection();
  }
}

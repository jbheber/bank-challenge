import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class HealthService {
  constructor(private databaseService: DatabaseService) {}

  async checkDbConnection() {
    performance.mark('start');

    await this.databaseService.client.$queryRaw`SELECT 1`;

    performance.mark('end');

    const benchmark = performance.measure('Measurement', 'start', 'end');

    return {
      dbBenchmark: benchmark,
    };
  }
}

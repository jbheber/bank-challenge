import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService implements OnModuleInit {
  public client: PrismaClient;

  constructor() {
    this.client = this.createClient();
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.client.$on('beforeExit', async () => {
      await app.close();
    });
  }

  private createClient() {
    return new PrismaClient({
      log: ([] as Array<Prisma.LogLevel | Prisma.LogDefinition>).concat(
        process.env.NODE_ENV && ['dev', 'text'].includes(process.env.NODE_ENV)
          ? [
              { level: 'query', emit: 'stdout' },
              { level: 'error', emit: 'stdout' },
            ]
          : [],
      ),
    });
  }
}

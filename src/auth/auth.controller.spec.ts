import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'some-secret',
          signOptions: { expiresIn: '1d' }, // e.g. 30s, 7d, 24h
        }),
        DatabaseModule,
        UsersModule,
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy, UsersService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be return auth token', async () => {
    const password = 'some-password';
    const email = 'some-email';
    const pwd = await bcrypt.hash(password, 10);
    const spy = jest
      .spyOn(service.client.user, 'findUnique')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            id: 1,
            password: pwd,
          }) as any,
      );

    const response = await controller.login({
      email,
      password,
    });
    expect(response).toBeDefined();
    expect(spy).toHaveBeenCalledWith({
      where: { email },
    });
  });

  it('should throw NotFoundException if user doesnt exist', async () => {
    const password = 'some-password';
    const email = 'some-email';
    const spy = jest
      .spyOn(service.client.user, 'findUnique')
      .mockImplementationOnce(() => Promise.resolve(null) as any);

    try {
      await controller.login({
        email,
        password,
      });
    } catch (ex) {
      expect(ex).toStrictEqual(
        new NotFoundException(`No user found for email: ${email}`),
      );
    }

    expect(spy).toHaveBeenCalledWith({
      where: { email },
    });
  });

  it('should throw UnauthorizedException if passwords doesnt match', async () => {
    const password = 'some-password';
    const email = 'some-email';
    const spy = jest
      .spyOn(service.client.user, 'findUnique')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            id: 1,
            password: 'some-other',
          }) as any,
      );

    try {
      await controller.login({
        email,
        password,
      });
    } catch (ex) {
      expect(ex).toStrictEqual(new UnauthorizedException('Invalid password'));
    }

    expect(spy).toHaveBeenCalledWith({
      where: { email },
    });
  });
});

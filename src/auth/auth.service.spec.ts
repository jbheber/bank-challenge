import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

describe('AuthService', () => {
  let service: AuthService;
  let dbservice: DatabaseService;
  let jwtservice: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'some-secret',
          signOptions: { expiresIn: '1d' }, // e.g. 30s, 7d, 24h
        }),
      ],
      providers: [AuthService, DatabaseService, JwtService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dbservice = module.get<DatabaseService>(DatabaseService);
    jwtservice = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  xit('should be return auth token', async () => {
    const password = 'some-password';
    const email = 'some-email';
    const pwd = await bcrypt.hash(password, 10);
    const spy = jest
      .spyOn(dbservice.client.user, 'findUnique')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            id: 1,
            password: pwd,
          }) as any,
      );
    const jwtSpy = jest
      .spyOn(jwtservice, 'sign')
      .mockImplementationOnce(() => 'some-token');

    const response = await service.login(email, password);
    expect(response).toBeDefined();
    expect(spy).toHaveBeenCalledWith({
      where: { email },
    });
    expect(jwtSpy).toHaveBeenCalledWith({ userId: 1 });
  });

  it('should throw NotFoundException if user doesnt exist', async () => {
    const password = 'some-password';
    const email = 'some-email';
    const spy = jest
      .spyOn(dbservice.client.user, 'findUnique')
      .mockImplementationOnce(() => Promise.resolve(null) as any);

    try {
      await service.login(email, password);
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
      .spyOn(dbservice.client.user, 'findUnique')
      .mockImplementationOnce(
        () =>
          Promise.resolve({
            id: 1,
            password: 'some-other',
          }) as any,
      );

    try {
      await service.login(email, password);
    } catch (ex) {
      expect(ex).toStrictEqual(new UnauthorizedException('Invalid password'));
    }

    expect(spy).toHaveBeenCalledWith({
      where: { email },
    });
  });
});

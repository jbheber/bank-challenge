import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { DatabaseService } from '../database/database.service';
import { AccountsService } from '../accounts/accounts.service';
import { UserEntity } from 'src/users/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Account_Type } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let accService: AccountsService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsService, DatabaseService, AccountsService],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    accService = module.get<AccountsService>(AccountsService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transfer', () => {
    it('Should fail if account doesnt exist', async () => {
      const spy = jest
        .spyOn(accService, 'findOne')
        .mockImplementation(() => Promise.resolve(null) as any);
      try {
        await service.transfer(
          {
            amount: 1000,
            description: 'some',
            fromAccountId: 1,
            toAccountId: 2,
          },
          { id: 1 } as UserEntity,
        );
      } catch (ex) {
        expect(ex).toStrictEqual(
          new NotFoundException(`Account with id 1 not found`),
        );
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(1);
      }
    });
    it('Should fail if account and user doesnt match', async () => {
      const spy = jest.spyOn(accService, 'findOne').mockImplementation(
        () =>
          Promise.resolve({
            id: 1,
            userId: 2,
          }) as any,
      );
      try {
        await service.transfer(
          {
            amount: 1000,
            description: 'some',
            fromAccountId: 1,
            toAccountId: 2,
          },
          { id: 1 } as UserEntity,
        );
      } catch (ex) {
        expect(ex).toStrictEqual(
          new ForbiddenException(`User can't withdraw from account 1`),
        );
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(1);
      }
    });
    it('Should fail if account doesnt has balance', async () => {
      const spy = jest.spyOn(accService, 'findOne').mockImplementationOnce(
        () =>
          Promise.resolve({
            id: 1,
            userId: 1,
            balance: new Decimal(700),
          }) as any,
      );
      try {
        await service.transfer(
          {
            amount: 1000,
            description: 'some',
            fromAccountId: 1,
            toAccountId: 2,
          },
          { id: 1 } as UserEntity,
        );
      } catch (ex) {
        expect(ex).toStrictEqual(new BadRequestException('Insufficient funds'));
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(1);
      }
    });
    it('Should fail if destination account doesnt exist', async () => {
      const spy = jest
        .spyOn(accService, 'findOne')
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 1,
              userId: 1,
              balance: new Decimal(3700),
            }) as any,
        )
        .mockImplementationOnce(() => Promise.resolve(null) as any);
      try {
        await service.transfer(
          {
            amount: 1000,
            description: 'some',
            fromAccountId: 1,
            toAccountId: 2,
          },
          { id: 1 } as UserEntity,
        );
      } catch (ex) {
        expect(ex).toStrictEqual(
          new NotFoundException(`Account with id 2 not found`),
        );
        expect(spy).toHaveBeenCalledTimes(2);
      }
    });
    it('Should fail if transfer is within user accounts', async () => {
      const spy = jest
        .spyOn(accService, 'findOne')
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 1,
              userId: 1,
              balance: new Decimal(3700),
            }) as any,
        )
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 2,
              userId: 1,
              balance: new Decimal(3700),
            }) as any,
        );
      try {
        await service.transfer(
          {
            amount: 1000,
            description: 'some',
            fromAccountId: 1,
            toAccountId: 2,
          },
          { id: 1 } as UserEntity,
        );
      } catch (ex) {
        expect(ex).toStrictEqual(
          new ForbiddenException(`User can't transfer to same user account`),
        );
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(1);
      }
    });
    it('Should fail if basic savings account exceeds 50000', async () => {
      const spy = jest
        .spyOn(accService, 'findOne')
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 1,
              userId: 1,
              balance: new Decimal(3700),
            }) as any,
        )
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 2,
              userId: 5,
              balance: new Decimal(49099),
              account_type: Account_Type.BASIC_SAVINGS,
            }) as any,
        );
      try {
        await service.transfer(
          {
            amount: 1000,
            description: 'some',
            fromAccountId: 1,
            toAccountId: 2,
          },
          { id: 1 } as UserEntity,
        );
      } catch (ex) {
        expect(ex).toStrictEqual(
          new BadRequestException(
            `Basic savings accounts shouldn't exceed 50000`,
          ),
        );
        expect(spy).toHaveBeenCalledTimes(2);
      }
    });
    it('Should create 2 transactions and update 2 accounts', async () => {
      const spy = jest
        .spyOn(accService, 'findOne')
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 1,
              userId: 1,
              balance: new Decimal(3700),
            }) as any,
        )
        .mockImplementationOnce(
          () =>
            Promise.resolve({
              id: 2,
              userId: 5,
              balance: new Decimal(49099),
              account_type: Account_Type.SAVINGS,
            }) as any,
        );
      const txSpy = jest
        .spyOn(dbService.client, '$transaction')
        .mockImplementationOnce(() => Promise.resolve({}) as any);
      const createManySpy = jest
        .spyOn(dbService.client.transaction, 'createMany')
        .mockImplementationOnce(() => Promise.resolve({}) as any);
      const updateSpy = jest
        .spyOn(dbService.client.account, 'update')
        .mockImplementation(() => Promise.resolve({}) as any);
      await service.transfer(
        {
          amount: 1000,
          description: 'some',
          fromAccountId: 1,
          toAccountId: 2,
        },
        { id: 1 } as UserEntity,
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(txSpy).toHaveBeenCalledTimes(1);
      expect(createManySpy).toHaveBeenCalledTimes(1);
      expect(createManySpy).toHaveBeenCalledWith({
        data: [
          {
            description: 'some',
            accountId: 1,
            balance: new Decimal('2700'),
            withdrawal: 1000,
          },
          {
            description: 'some',
            accountId: 2,
            balance: new Decimal('50099'),
            deposit: 1000,
          },
        ],
      });
      expect(updateSpy).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: {
          balance: new Decimal('2700'),
        },
      });
      expect(updateSpy).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: {
          balance: new Decimal('50099'),
        },
      });
    });
  });
});

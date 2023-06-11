import { ApiProperty } from '@nestjs/swagger';
import {
  Account,
  Account_Type,
  Bank,
  Prisma,
  Transaction,
  User,
} from '@prisma/client';

export class AccountEntity implements Account {
  constructor(partial: Partial<AccountEntity | Account> | null = {}) {
    Object.assign(this, partial);
    this.currentBalance = partial?.balance?.valueOf() ?? 'N/A';
  }
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  uuid: string;

  @ApiProperty()
  account_type: Account_Type;

  @ApiProperty()
  balance: Prisma.Decimal;

  @ApiProperty()
  currentBalance: string;

  @ApiProperty()
  User: User;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  Bank: Bank;

  @ApiProperty()
  bankId: number;

  @ApiProperty()
  transactions: Transaction[];
}

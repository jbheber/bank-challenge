import { ApiProperty } from '@nestjs/swagger';
import {
  Account,
  Account_Type,
  Bank,
  Interest_History,
  Transaction,
} from '@prisma/client';
import * as moment from 'moment';

type AccountWithIncludes = Account & {
  Bank: Bank | null;
  transactions: Transaction[];
  Interest_History: Interest_History[];
};

export class StatementEntity {
  constructor(
    partial: Partial<AccountWithIncludes> | null = {},
    date: string | moment.Moment | Date,
  ) {
    this.account_id = partial?.id ?? 0;
    this.account_uuid = partial?.uuid ?? 'N/A';
    this.account_type = partial?.account_type ?? Account_Type.BASIC_SAVINGS;
    this.Bank = partial?.Bank ?? null;
    this.transactions = partial?.transactions ?? ([] as any[]);
    const [interest_history] = partial?.Interest_History ?? [];
    this.interest_history = interest_history ?? null;
    const dateObject = moment(date);
    this.period = `${dateObject
      .startOf('month')
      .format('YYYY/MM/DD')}-${dateObject.endOf('month').format('YYYY-MM-DD')}`;
  }
  @ApiProperty()
  account_id: number;

  @ApiProperty()
  account_uuid: string;

  @ApiProperty()
  account_type: Account_Type;

  @ApiProperty()
  Bank: Bank | null;

  @ApiProperty()
  transactions: Transaction[];

  @ApiProperty()
  interest_history: Interest_History | null;

  @ApiProperty()
  period: string;
}

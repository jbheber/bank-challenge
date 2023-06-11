import { ApiProperty } from '@nestjs/swagger';
import { Account_Type } from '@prisma/client';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @ApiProperty()
  accountType: Account_Type;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  bankId: number;

  @IsNumber()
  @ApiProperty()
  userId?: number;
}

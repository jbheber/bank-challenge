import { ApiProperty } from '@nestjs/swagger';

export class TransactionResult {
  @ApiProperty()
  newSrcBalance: string;

  @ApiProperty()
  totalDestBalance: string;

  @ApiProperty()
  transferredAt: string;
}

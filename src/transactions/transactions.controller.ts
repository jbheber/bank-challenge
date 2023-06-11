import { Controller, Post, Body, Version, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { TransactionResult } from './entities/transaction-result.entity';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@ApiTags('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: TransactionResult })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.transactionsService.transfer(createTransactionDto, currentUser);
  }
}

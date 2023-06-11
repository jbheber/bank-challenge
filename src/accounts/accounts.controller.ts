import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as moment from 'moment';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountEntity } from './entities/account.entity';
import { StatementEntity } from './entities/statement.entity';

@Controller('accounts')
@ApiTags('account')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: AccountEntity })
  create(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.accountsService.create(createAccountDto, currentUser);
  }

  @Get()
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AccountEntity, isArray: true })
  async findAll(
    @CurrentUser() currentUser: UserEntity,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const accounts = await this.accountsService.findAll(skip, take, {
      userId: currentUser.id,
    });
    return accounts.map((account) => new AccountEntity(account));
  }

  @Get(':id')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AccountEntity })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const account = await this.accountsService.findOne(id);
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    await this.usersService.checkSelfUser(currentUser, account?.userId ?? 0);

    return new AccountEntity(account);
  }

  @Get(':id/statement')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: StatementEntity })
  async findOneStatement(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: UserEntity,
    @Query('date') date: string,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    const dateObject = moment(date);
    if (!dateObject.isValid() || dateObject.isAfter()) {
      throw new BadRequestException(`Invalid date`);
    }
    const transactionsQuery = {
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        createdAt: {
          gte: new Date(dateObject.startOf('month').toISOString()),
          lte: new Date(dateObject.endOf('month').toISOString()),
        },
      },
    };
    const interestHistoryQuery = {
      where: {
        createdAt: {
          gte: new Date(dateObject.startOf('month').toISOString()),
          lte: new Date(dateObject.endOf('month').toISOString()),
        },
      },
    };
    const account = await this.accountsService.findOne(
      id,
      true,
      transactionsQuery,
      interestHistoryQuery,
    );
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    await this.usersService.checkSelfUser(currentUser, account?.userId ?? 0);

    return new StatementEntity(account as any, dateObject);
  }

  @Patch(':id')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AccountEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const account = await this.accountsService.findOne(id);
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    await this.usersService.checkSelfUser(currentUser, account?.userId ?? 0);
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AccountEntity })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const account = await this.accountsService.findOne(id);
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    await this.usersService.checkSelfUser(currentUser, account?.userId ?? 0);
    return this.accountsService.remove(id);
  }
}

import {
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountEntity } from './entities/account.entity';

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

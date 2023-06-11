import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  private roundsOfHashing: number;

  constructor(private databaseService: DatabaseService) {
    this.roundsOfHashing = Number(process.env.ROUNDS_OF_HASHING ?? 10);
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.roundsOfHashing,
    );

    createUserDto.password = hashedPassword;

    return this.databaseService.client.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.databaseService.client.user.findMany();
  }

  findOne(id: number) {
    return this.databaseService.client.user.findUnique({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        this.roundsOfHashing,
      );
    }

    return this.databaseService.client.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return this.databaseService.client.user.delete({ where: { id } });
  }

  async checkSelfUser(requesterUser: UserEntity, id: number) {
    const user = await this.findOne(id);
    if (
      requesterUser.role === Role.USER &&
      Number(requesterUser.id) !== Number(user?.id)
    ) {
      throw new UnauthorizedException('Unauthorized user');
    }
    return user;
  }
}

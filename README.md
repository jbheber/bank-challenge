# Bank challenge

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
yarn install --frozen-lockfile
```

## Run locally

Pre: Needs a local postgres server

* Set the connection string in the .env

```txt
DATABASE_URL="postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@localhost:5432/{POSTGRES_DBNAME}?schema=public"
```

* create the database and seed some data

```bash
yarn prisma db push && yarn prisma db seed
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

You should be able to access the [swagger page](http://localhost:3000/api)

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Run in docker-compose

```bash
docker-compose up
```

This will spin up the app in a docker container with a postgres server and a redis server.
Additionally it will give you a pgadmin to see the database.

To connect the pgadmin GUI to the postgres database add the following connection. The user/pass for the postgres server are in the secrets folder.

<img src="images/connection.png"
     alt="Connection"
     style="width: 50%; float: left;" />

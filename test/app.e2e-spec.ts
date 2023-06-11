import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Auth', () => {
    it('/v1/auth/login OK Admin', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'admin@admin.com', password: 'adminpwd' })
        .expect(201)
        .then((res) => {
          expect(res.body.accessToken).toBeDefined();
          adminToken = res.body.accessToken;
        });
    });
    it('/v1/auth/login OK User ', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'user@user.com', password: 'userpwd' })
        .expect(201)
        .then((res) => {
          expect(res.body.accessToken).toBeDefined();
          userToken = res.body.accessToken;
        });
    });

    it('/v1/auth/login Unauthorized', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'admin@admin.com', password: 'notpwd' })
        .expect(401);
    });

    it('/v1/auth/login Not Found', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'not@admin.com', password: 'not' })
        .expect(404);
    });
  });

  describe('Users', () => {
    describe('/v1/users (GET)', () => {
      it('200 OK', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
      it('401 no token', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Accept', 'application/json')
          .expect(401);
      });

      it('403 Unauthorized', () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });
    describe('/v1/users (POST)', () => {
      it('201 OK', () => {
        return request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'New user',
            email: 'new-user@user.com',
            password: 'newuserpwd',
          })
          .set('Accept', 'application/json')
          .expect(201);
      });
    });
    describe('/v1/users/:id (GET)', () => {
      it('200 OK Self user admin', () => {
        return request(app.getHttpServer())
          .get('/users/1')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
      it('200 OK Self user', () => {
        return request(app.getHttpServer())
          .get('/users/2')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      });
      it('200 OK Other user when admin', () => {
        return request(app.getHttpServer())
          .get('/users/2')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
      it('401 no token', () => {
        return request(app.getHttpServer())
          .get('/users/1')
          .set('Accept', 'application/json')
          .expect(401);
      });

      it('401 Unauthorized if not self user', () => {
        return request(app.getHttpServer())
          .get('/users/1')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(401);
      });
    });
    describe('/v1/users/:id (PATCH)', () => {
      it('200 OK Self user admin', () => {
        return request(app.getHttpServer())
          .patch('/users/1')
          .send({ name: 'super-admin' })
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
      it('200 OK Self user', () => {
        return request(app.getHttpServer())
          .patch('/users/2')
          .send({ name: 'super-user' })
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      });
      it('200 OK Other user when admin', () => {
        return request(app.getHttpServer())
          .patch('/users/2')
          .send({ name: 'super-user-by-admin' })
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
      it('401 no token', () => {
        return request(app.getHttpServer())
          .patch('/users/1')
          .send({ name: 'super-user-by-admin' })
          .set('Accept', 'application/json')
          .expect(401);
      });

      it('401 Unauthorized if not self user', () => {
        return request(app.getHttpServer())
          .patch('/users/1')
          .send({ name: 'super-admin-by-user' })
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(401);
      });
    });
  });
});

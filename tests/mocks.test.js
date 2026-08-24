const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');

describe('Mocks (/api/mocks)', () => {
  describe('GET /api/mocks/users (preview, no toca la base)', () => {
    it('devuelve 200 con la cantidad de usuarios pedida por count, sin passwordHash', async () => {
      const res = await request(app).get('/api/mocks/users').query({ count: 5 });

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(5);
      res.body.data.forEach((user) => {
        expect(user).to.not.have.property('passwordHash');
        expect(user).to.have.property('email');
      });
    });

    it('no persiste nada en la base de datos', async () => {
      await request(app).get('/api/mocks/users').query({ count: 5 });

      const res = await request(app).get('/api/users');
      expect(res.body.data).to.have.lengthOf(0);
    });

    it('devuelve 400 con un count inválido (no numérico)', async () => {
      const res = await request(app).get('/api/mocks/users').query({ count: 'abc' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_MOCK_COUNT' });
    });

    it('devuelve 400 con un count fuera de rango (mayor al máximo permitido)', async () => {
      const res = await request(app).get('/api/mocks/users').query({ count: 999 });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_MOCK_COUNT' });
    });

    it('devuelve 400 con un count decimal', async () => {
      const res = await request(app).get('/api/mocks/users').query({ count: 2.5 });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_MOCK_COUNT' });
    });
  });

  describe('GET /api/mocks/orders y /api/mocks/deliveries (preview)', () => {
    it('devuelve 200 con la forma esperada de un pedido simulado', async () => {
      const res = await request(app).get('/api/mocks/orders').query({ count: 3 });

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(3);
      expect(res.body.data[0]).to.have.property('items');
      expect(res.body.data[0]).to.have.property('totalAmount');
    });

    it('devuelve 200 con la forma esperada de una entrega simulada', async () => {
      const res = await request(app).get('/api/mocks/deliveries').query({ count: 3 });

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(3);
    });
  });

  describe('POST /api/mocks/seed (carga real en la base)', () => {
    it('devuelve 201 y persiste usuarios y pedidos relacionados en la base', async () => {
      const res = await request(app)
        .post('/api/mocks/seed')
        .send({ usersCount: 5, ordersCount: 5, deliveriesCount: 3 });

      expect(res.status).to.equal(201);
      expect(res.body.data.summary).to.include({
        usersCreated: 5,
        ordersCreated: 5,
        deliveriesCreated: 3,
      });

      const usersRes = await request(app).get('/api/users');
      expect(usersRes.body.data).to.have.lengthOf(5);

      const ordersRes = await request(app).get('/api/orders');
      expect(ordersRes.body.data).to.have.lengthOf(5);
    });

    it('nunca crea más entregas que pedidos, aunque se pida más', async () => {
      const res = await request(app)
        .post('/api/mocks/seed')
        .send({ usersCount: 4, ordersCount: 2, deliveriesCount: 10 });

      expect(res.status).to.equal(201);
      expect(res.body.data.summary).to.include({ ordersCreated: 2, deliveriesCreated: 2 });
    });

    it('devuelve 400 con INVALID_MOCK_COUNT si ordersCount está fuera de rango', async () => {
      const res = await request(app)
        .post('/api/mocks/seed')
        .send({ usersCount: 5, ordersCount: 500, deliveriesCount: 1 });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_MOCK_COUNT' });
      expect(res.body.error).to.have.nested.property('details.field', 'ordersCount');

      // Nada debería haberse guardado si la validación falló antes de insertar
      const usersRes = await request(app).get('/api/users');
      expect(usersRes.body.data).to.have.lengthOf(0);
    });
  });
});

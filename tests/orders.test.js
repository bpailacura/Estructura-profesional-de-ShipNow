const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../src/app');
const { createUser, validOrderPayload } = require('./helpers/testData');

describe('Pedidos (/api/orders)', () => {
  describe('POST /api/orders', () => {
    it('devuelve 201 y crea el pedido cuando el customer existe y los items son válidos', async () => {
      const customer = await createUser(request(app));
      const payload = validOrderPayload(customer._id);

      const res = await request(app).post('/api/orders').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('_id');
      expect(res.body.data).to.have.property('status', 'PENDING');
      expect(res.body.data).to.have.property('customer', customer._id);
      expect(res.body.data.items).to.have.lengthOf(2);
    });

    it('calcula el totalAmount en el servidor a partir de los items (ignora cualquier total enviado por el cliente)', async () => {
      const customer = await createUser(request(app));
      const payload = validOrderPayload(customer._id, { totalAmount: 999999 });

      const res = await request(app).post('/api/orders').send(payload);

      // 2 * 100 + 1 * 50 = 250, sin importar el 999999 que mandó el cliente
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('totalAmount', 250);
    });

    it('devuelve 404 si el customer no existe', async () => {
      const nonExistentCustomerId = new mongoose.Types.ObjectId().toString();
      const payload = validOrderPayload(nonExistentCustomerId);

      const res = await request(app).post('/api/orders').send(payload);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND' });
    });

    it('devuelve 400 si faltan items', async () => {
      const customer = await createUser(request(app));
      const payload = validOrderPayload(customer._id, { items: [] });

      const res = await request(app).post('/api/orders').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error).to.have.nested.property('details.field', 'items');
    });

    it('devuelve 400 si un item tiene quantity inválida', async () => {
      const customer = await createUser(request(app));
      const payload = validOrderPayload(customer._id, {
        items: [{ productName: 'Producto', quantity: 0, unitPrice: 10 }],
      });

      const res = await request(app).post('/api/orders').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('GET /api/orders', () => {
    it('devuelve 200 y todos los pedidos cuando no se filtra por status', async () => {
      const customer = await createUser(request(app));
      await request(app).post('/api/orders').send(validOrderPayload(customer._id));
      await request(app).post('/api/orders').send(validOrderPayload(customer._id));

      const res = await request(app).get('/api/orders');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(2);
    });

    it('filtra correctamente por status vía query param', async () => {
      const customer = await createUser(request(app));
      const created = await request(app).post('/api/orders').send(validOrderPayload(customer._id));
      await request(app)
        .put(`/api/orders/${created.body.data._id}/status`)
        .send({ status: 'SHIPPED' });

      const res = await request(app).get('/api/orders').query({ status: 'SHIPPED' });

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.have.property('status', 'SHIPPED');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('devuelve 200 y el pedido cuando el id existe', async () => {
      const customer = await createUser(request(app));
      const created = await request(app).post('/api/orders').send(validOrderPayload(customer._id));

      const res = await request(app).get(`/api/orders/${created.body.data._id}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('_id', created.body.data._id);
    });

    it('devuelve 404 con el formato de error esperado cuando el pedido no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/api/orders/${nonExistentId}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'ORDER_NOT_FOUND' });
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('devuelve 200 y actualiza el estado con un status válido', async () => {
      const customer = await createUser(request(app));
      const created = await request(app).post('/api/orders').send(validOrderPayload(customer._id));

      const res = await request(app)
        .put(`/api/orders/${created.body.data._id}/status`)
        .send({ status: 'SHIPPED' });

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('status', 'SHIPPED');
    });

    it('devuelve 400 con un status que no existe en el dominio', async () => {
      const customer = await createUser(request(app));
      const created = await request(app).post('/api/orders').send(validOrderPayload(customer._id));

      const res = await request(app)
        .put(`/api/orders/${created.body.data._id}/status`)
        .send({ status: 'ESTADO_INVENTADO' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_ORDER_STATUS' });
    });

    it('devuelve 404 al actualizar el estado de un pedido inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .put(`/api/orders/${nonExistentId}/status`)
        .send({ status: 'SHIPPED' });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'ORDER_NOT_FOUND' });
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('devuelve 204 y elimina el pedido existente', async () => {
      const customer = await createUser(request(app));
      const created = await request(app).post('/api/orders').send(validOrderPayload(customer._id));

      const res = await request(app).delete(`/api/orders/${created.body.data._id}`);
      expect(res.status).to.equal(204);

      const getRes = await request(app).get(`/api/orders/${created.body.data._id}`);
      expect(getRes.status).to.equal(404);
    });

    it('devuelve 404 al intentar eliminar un pedido inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).delete(`/api/orders/${nonExistentId}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'ORDER_NOT_FOUND' });
    });
  });
});

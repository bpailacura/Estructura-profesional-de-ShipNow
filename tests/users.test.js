const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../src/app');
const { validUserPayload, createUser } = require('./helpers/testData');

describe('Usuarios (/api/users)', () => {
  describe('GET /api/users', () => {
    it('devuelve 200 y un array vacío cuando no hay usuarios', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data').that.is.an('array');
      expect(res.body.data).to.have.lengthOf(0);
    });

    it('devuelve 200 y la lista de usuarios existentes, sin exponer el passwordHash', async () => {
      await createUser(request(app));
      await createUser(request(app));

      const res = await request(app).get('/api/users');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(2);
      res.body.data.forEach((user) => {
        expect(user).to.not.have.property('passwordHash');
        expect(user).to.have.property('email');
        expect(user).to.have.property('role');
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('devuelve 200 y el usuario cuando el id existe', async () => {
      const created = await createUser(request(app));

      const res = await request(app).get(`/api/users/${created._id}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('_id', created._id);
      expect(res.body.data).to.have.property('email', created.email);
      expect(res.body.data).to.not.have.property('passwordHash');
    });

    it('devuelve 404 con el formato de error esperado cuando el id no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/api/users/${nonExistentId}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND' });
      expect(res.body.error).to.have.property('message');
    });

    it('devuelve 400 cuando el id no tiene un formato válido', async () => {
      const res = await request(app).get('/api/users/id-con-formato-invalido');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('POST /api/users/register', () => {
    it('devuelve 201 y el usuario creado con datos válidos', async () => {
      const payload = validUserPayload();

      const res = await request(app).post('/api/users/register').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.data).to.include({ name: payload.name, email: payload.email, role: 'USER' });
      expect(res.body.data).to.have.property('_id');
      expect(res.body.data).to.not.have.property('passwordHash');
    });

    it('nunca permite auto-asignarse el rol ADMIN desde el registro público', async () => {
      const payload = validUserPayload({ role: 'ADMIN' });

      const res = await request(app).post('/api/users/register').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('role', 'USER');
    });

    it('devuelve 400 si falta un campo obligatorio (email)', async () => {
      const payload = validUserPayload();
      delete payload.email;

      const res = await request(app).post('/api/users/register').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error).to.have.nested.property('details.field', 'email');
    });

    it('devuelve 400 si el password es demasiado corto', async () => {
      const payload = validUserPayload({ password: '123' });

      const res = await request(app).post('/api/users/register').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
    });

    it('devuelve 409 si el email ya está registrado', async () => {
      const payload = validUserPayload();
      await request(app).post('/api/users/register').send(payload);

      const res = await request(app).post('/api/users/register').send(payload);

      expect(res.status).to.equal(409);
      expect(res.body.error).to.include({ code: 'USER_ALREADY_EXISTS' });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('devuelve 200 y el usuario actualizado con datos válidos', async () => {
      const created = await createUser(request(app));

      const res = await request(app)
        .put(`/api/users/${created._id}`)
        .send({ name: 'Nombre Actualizado' });

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('name', 'Nombre Actualizado');
    });

    it('devuelve 404 al intentar actualizar un usuario inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .put(`/api/users/${nonExistentId}`)
        .send({ name: 'No importa' });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND' });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('devuelve 204 y elimina al usuario existente', async () => {
      const created = await createUser(request(app));

      const res = await request(app).delete(`/api/users/${created._id}`);
      expect(res.status).to.equal(204);

      const getRes = await request(app).get(`/api/users/${created._id}`);
      expect(getRes.status).to.equal(404);
    });

    it('devuelve 404 al intentar eliminar un usuario inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).delete(`/api/users/${nonExistentId}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND' });
    });
  });
});

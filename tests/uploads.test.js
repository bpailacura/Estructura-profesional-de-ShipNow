const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const { createUser, validOrderPayload } = require('./helpers/testData');

// El registro público (POST /users/register) nunca asigna DELIVERY_PERSON
// (misma regla que bloquea ADMIN — ver user.service.js). No hay otra vía
// en la API para crear un repartidor, así que para el test lo insertamos
// directo contra el modelo (el passwordHash es irrelevante acá, no se
// ejercita ningún login en este flujo).
async function createDeliveryPerson() {
  const user = new User({
    name: 'Repartidor Test',
    email: `repartidor.test.${Date.now()}.${Math.random().toString(16).slice(2)}@shipnow.test`,
    passwordHash: 'no-aplica-en-este-test',
    role: 'DELIVERY_PERSON',
  });
  await user.save();
  return user.toObject();
}

// Helper local: crea un pedido + una entrega válida (con un repartidor
// real, rol DELIVERY_PERSON) para poder testear la carga de comprobantes.
async function createDelivery(req) {
  const customer = await createUser(req);
  const deliveryPerson = await createDeliveryPerson();

  const orderRes = await req.post('/api/orders').send(validOrderPayload(customer._id));
  if (orderRes.status !== 201) {
    throw new Error(`No se pudo crear el pedido de prueba: ${JSON.stringify(orderRes.body)}`);
  }

  const deliveryRes = await req.post('/api/deliveries').send({
    order: orderRes.body.data._id,
    deliveryPerson: deliveryPerson._id,
    address: 'Av. Siempreviva 742, Florencio Varela',
    estimatedDeliveryDate: '2026-12-01T18:00:00.000Z',
  });
  if (deliveryRes.status !== 201) {
    throw new Error(`No se pudo crear la entrega de prueba: ${JSON.stringify(deliveryRes.body)}`);
  }
  return deliveryRes.body.data;
}

describe('Carga de archivos (Multer)', () => {
  describe('POST /api/users/:id/documents', () => {
    it('devuelve 201 y guarda los metadatos del documento con datos válidos', async () => {
      const user = await createUser(request(app));

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', 'DNI_FRONT')
        .attach('file', Buffer.from('contenido de prueba'), 'dni-frente.jpg');

      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('documents').that.is.an('array').with.lengthOf(1);
      const doc = res.body.data.documents[0];
      expect(doc).to.include({ originalName: 'dni-frente.jpg', documentType: 'DNI_FRONT' });
      expect(doc).to.have.property('storedName');
      expect(doc).to.have.property('path');
      expect(doc).to.have.property('size');
    });

    it('devuelve 400 (FILE_REQUIRED) cuando no se adjunta ningún archivo', async () => {
      const user = await createUser(request(app));

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', 'DNI_FRONT');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'FILE_REQUIRED' });
    });

    it('devuelve 400 (INVALID_DOCUMENT_TYPE) cuando el tipo de documento no es válido', async () => {
      const user = await createUser(request(app));

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', 'CARNET_DE_CLUB')
        .attach('file', Buffer.from('contenido de prueba'), 'foto.jpg');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_DOCUMENT_TYPE' });
    });

    it('devuelve 400 (INVALID_FILE_TYPE) cuando el tipo de archivo no está permitido', async () => {
      const user = await createUser(request(app));

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', 'DNI_FRONT')
        .attach('file', Buffer.from('contenido de prueba'), 'documento.exe');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_FILE_TYPE' });
    });

    it('devuelve 404 (USER_NOT_FOUND) cuando el usuario no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/users/${nonExistentId}/documents`)
        .field('documentType', 'DNI_FRONT')
        .attach('file', Buffer.from('contenido de prueba'), 'dni-frente.jpg');

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND' });
    });
  });

  describe('POST /api/deliveries/:id/proof', () => {
    it('devuelve 201 y guarda el comprobante asociado a la entrega (documentType por defecto)', async () => {
      const delivery = await createDelivery(request(app));

      const res = await request(app)
        .post(`/api/deliveries/${delivery._id}/proof`)
        .attach('file', Buffer.from('contenido de prueba'), 'comprobante.jpg');

      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('proofs').that.is.an('array').with.lengthOf(1);
      expect(res.body.data.proofs[0]).to.include({
        originalName: 'comprobante.jpg',
        documentType: 'DELIVERY_PROOF',
      });
    });

    it('devuelve 400 (FILE_REQUIRED) cuando no se adjunta ningún archivo', async () => {
      const delivery = await createDelivery(request(app));

      const res = await request(app).post(`/api/deliveries/${delivery._id}/proof`);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'FILE_REQUIRED' });
    });

    it('devuelve 404 (DELIVERY_NOT_FOUND) cuando la entrega no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/deliveries/${nonExistentId}/proof`)
        .attach('file', Buffer.from('contenido de prueba'), 'comprobante.jpg');

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'DELIVERY_NOT_FOUND' });
    });
  });
});

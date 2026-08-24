const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');

describe('Endpoint de logger (/api/logger)', () => {
  it('devuelve 200 y confirma que se generaron los logs de prueba', async () => {
    const res = await request(app).get('/api/logger/test');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message').that.is.a('string');
    expect(res.body.message).to.match(/debug|info|warning|error|fatal/i);
  });
});

describe('Documentación de la API (/api/docs)', () => {
  it('devuelve 200 y sirve la interfaz HTML de Swagger', async () => {
    const res = await request(app).get('/api/docs/').redirects(1);

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.match(/html/);
  });
});

describe('Ruta inexistente', () => {
  it('devuelve 404 con el formato de error genérico para una ruta no definida', async () => {
    const res = await request(app).get('/api/esta-ruta-no-existe');

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.have.property('message', 'Ruta no encontrada');
  });
});

describe('Healthcheck (/health)', () => {
  it('devuelve 200 y confirma que el servidor está vivo', async () => {
    const res = await request(app).get('/health');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'ok' });
  });
});

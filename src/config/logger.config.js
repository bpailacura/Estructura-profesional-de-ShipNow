/**
 * src/config/logger.config.js
 *
 * Configuración centralizada del logger de la aplicación (Winston).
 * Ningún otro archivo debe instanciar Winston directamente: todos
 * importan este módulo para loguear, así se garantiza el mismo
 * formato y el mismo comportamiento en toda la app.
 */

const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const config = require('./env.config');

// Niveles personalizados (de más a menos grave). Winston respeta este
// orden numérico: cada transport con `level: 'X'` deja pasar X y todo
// lo que tenga un número MENOR (más grave), y descarta lo que tenga
// un número mayor (menos grave).
const LOG_LEVELS = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5,
  },
  colors: {
    fatal: 'bold red',
    error: 'red',
    warning: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(LOG_LEVELS.colors);

// En desarrollo queremos ver todo, incluso `debug`.
// En producción solo lo relevante: info, warning, error y fatal.
const levelForEnv = config.isProduction ? 'info' : 'debug';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Formato base compartido: timestamp legible + nivel + mensaje.
// Ej: "2026-08-01 10:12:03 [info]    Servidor ShipNow escuchando en el puerto 3000"
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}]${' '.repeat(Math.max(1, 8 - level.length))}${message}`;
  })
);

// Consola: mismo formato de arriba pero coloreado, solo para humanos leyendo la terminal.
const consoleFormat = winston.format.combine(winston.format.colorize({ all: true }), baseFormat);

// Archivo de errores: rotación diaria, se queda SOLO con fatal y error
// (gracias al orden numérico de los niveles, `level: 'error'` excluye
// warning/info/http/debug automáticamente).
const errorFileTransport = new winston.transports.DailyRotateFile({
  dirname: LOGS_DIR,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d', // conserva 14 días de historial, después rota afuera
  maxSize: '10m',
  zippedArchive: true,
  format: baseFormat,
});

// Archivo combinado: historial general de la app (todo lo que loguea
// el nivel configurado para el entorno), también con rotación diaria.
const combinedFileTransport = new winston.transports.DailyRotateFile({
  dirname: LOGS_DIR,
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: levelForEnv,
  maxFiles: '7d',
  maxSize: '10m',
  zippedArchive: true,
  format: baseFormat,
});

const logger = winston.createLogger({
  levels: LOG_LEVELS.levels,
  level: levelForEnv,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    errorFileTransport,
    combinedFileTransport,
  ],
  exitOnError: false,
});

module.exports = logger;

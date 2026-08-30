const mongoose = require('mongoose');
const { DELIVERY_STATUS } = require('../constants');
const fileMetadataSchema = require('./shared/fileMetadata.schema');

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // una entrega corresponde a un único pedido
    },
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.ASSIGNED,
    },
    address: { type: String, required: true, trim: true },
    estimatedDeliveryDate: { type: Date, required: true },
    // Comprobantes asociados a esta entrega (foto de la entrega, firma,
    // recibo, etc.). Solo metadatos: el archivo vive en uploads/deliveries/.
    proofs: { type: [fileMetadataSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);

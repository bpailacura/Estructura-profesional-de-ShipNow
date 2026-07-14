const productService = require('../services/product.service');

class ProductController {
  async getAll(req, res, next) {
    try {
      const onlyAvailable = req.query.available === 'true';
      const products = await productService.getAllProducts({ onlyAvailable });
      return res.status(200).json({ data: products });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return res.status(200).json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return res.status(201).json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return res.status(200).json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();

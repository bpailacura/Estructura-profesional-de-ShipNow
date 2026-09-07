const userService = require('../services/user.service');

class UserController {
  async getAll(req, res, next) {
    try {
      const { page, limit } = req.query;
      const { data, meta } = await userService.getAllUsers({ page, limit });
      return res.status(200).json({ data, meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const user = await userService.registerUser(req.body);
      return res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  // POST /users/:id/documents (multipart/form-data)
  // El archivo llega en req.file (middleware uploadUserDocument ya corrió antes).
  async uploadDocument(req, res, next) {
    try {
      const user = await userService.addUserDocument(req.params.id, req.file, req.body.documentType);
      return res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

const categoryService = require("../services/categoryService");

async function listCategories(req, res, next) {
  try {
    return res.json(await categoryService.listCategories());
  } catch (err) {
    return next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      const err = new Error("Nome e slug são obrigatórios.");
      err.statusCode = 400;
      return next(err);
    }
    const category = await categoryService.createCategory({ name, slug });
    return res.status(201).json(category);
  } catch (err) {
    return next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listCategories, createCategory, deleteCategory };

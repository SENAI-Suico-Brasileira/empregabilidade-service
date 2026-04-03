const prisma = require("../lib/prisma");

async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

async function createCategory({ name, slug }) {
  return prisma.category.create({ data: { name, slug } });
}

async function deleteCategory(id) {
  return prisma.category.delete({ where: { id: Number(id) } });
}

module.exports = { listCategories, createCategory, deleteCategory };

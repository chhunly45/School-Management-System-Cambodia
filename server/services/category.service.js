const { Category } = require('../models');

const listCategories = async () => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  return categories;
};

const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return category;
};

const createCategory = async ({ name, slug, parent, description, icon, order, labelKh }) => {
  const exists = await Category.findOne({ slug });
  if (exists) {
    const error = new Error('Category slug already exists');
    error.statusCode = 409;
    throw error;
  }

  const category = await Category.create({
    name,
    labelKh: labelKh || '',
    slug,
    parent: parent || null,
    description,
    icon,
    order: order || 0
  });
  return category;
};

const updateCategory = async (categoryId, updates) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (updates.slug && updates.slug !== category.slug) {
    const exists = await Category.findOne({ slug: updates.slug });
    if (exists) {
      const error = new Error('Category slug already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(category, updates);
  await category.save();
  return category;
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  await category.deleteOne();
};

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

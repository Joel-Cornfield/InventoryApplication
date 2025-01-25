const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET all categories
router.get('/', categoryController.getAllCategories);

// GET new category form
router.get('/new', categoryController.getNewCategoryForm);

// GET single category
router.get('/:id', categoryController.getCategory);

// POST create new category
router.post('/', categoryController.createCategory);

// PUT update category
router.put('/:id', categoryController.updateCategory);

// DELETE category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
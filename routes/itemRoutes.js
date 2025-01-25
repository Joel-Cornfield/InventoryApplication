const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET all items
router.get('/', asyncHandler(itemController.getAllItems));

// GET new item form
router.get('/new', asyncHandler(itemController.getNewItemForm));

// GET single item
router.get('/:id', asyncHandler(itemController.getItem));

// GET edit item form
router.get('/:id/edit', asyncHandler(itemController.getEditItemForm));

// POST create new item
router.post('/', asyncHandler(itemController.createItem));

// PUT update item
router.put('/:id', asyncHandler(itemController.updateItem));

// DELETE item
router.delete('/:id', asyncHandler(itemController.deleteItem));

module.exports = router;
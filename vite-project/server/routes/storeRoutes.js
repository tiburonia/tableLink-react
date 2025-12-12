const express = require('express');
const storeController = require('../controllers/storeController');

const router = express.Router();

router.get('/', storeController.getAll);
router.get('/search', storeController.search);
router.get('/nearby', storeController.getNearby);
router.get('/category/:category', storeController.getByCategory);
router.get('/:id', storeController.getById);
router.post('/', storeController.create);
router.put('/:id', storeController.update);
router.delete('/:id', storeController.delete);

module.exports = router;

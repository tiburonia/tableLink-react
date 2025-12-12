const express = require('express');
const databaseController = require('../controllers/databaseController');

const router = express.Router();

router.get('/test-connection', databaseController.testConnection);
router.post('/init', databaseController.init);

module.exports = router;

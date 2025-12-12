const express = require('express');
const storeRoutes = require('./storeRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const databaseRoutes = require('./databaseRoutes');

const router = express.Router();

router.use('/stores', storeRoutes);
router.use('/users', userRoutes);
router.use('/', authRoutes);
router.use('/', databaseRoutes);

module.exports = router;

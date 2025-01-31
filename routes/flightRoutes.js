const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { ensureAuthenticated, ensureVerified } = require('../config/auth');

router.get('/', ensureAuthenticated, ensureVerified, flightController.getOffer);
router.get("/search", ensureAuthenticated,ensureVerified, flightController.getOffer);

module.exports = router;
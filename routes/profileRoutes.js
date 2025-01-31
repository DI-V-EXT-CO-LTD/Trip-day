const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);
router.post('/update', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);

module.exports = router;
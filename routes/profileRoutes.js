const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);
router.post('/update', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);
router.post('/change-phone', profileController.changePhone);
router.post('/change-company', profileController.changeCompany);
router.post('/change-business', profileController.changeBusiness);
router.post('/change-person', profileController.changePerson);

module.exports = router;
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/packageDetails/:id', ensureAuthenticated, packageController.getPackageDetails);

// Golf course list page (new route)
router.get('/list', ensureAuthenticated, packageController.listPackageCourses);

router.get('/search', ensureAuthenticated, packageController.searchPackages);

module.exports = router;
// routes/golfRoutes.js
const express = require('express');
const router = express.Router();
const golfController = require('../controllers/golfController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Golf course search
router.get('/search', ensureAuthenticated, golfController.searchGolfCourses);

// Golf course list page (new route)
router.get('/courses', ensureAuthenticated, golfController.listGolfCourses);

// Golf course list page (old route, keep for compatibility)
router.get('/golf-courses', ensureAuthenticated, golfController.listGolfCourses);

// Golf course details page
router.get('/golf-courses/:id', ensureAuthenticated, golfController.getGolfDetails);

// Add new golf course form
router.get('/admin/add-golf', ensureAuthenticated, golfController.getAddGolfForm);

// Add new golf course process
router.post('/admin/add-golf', ensureAuthenticated, golfController.addGolf);

module.exports = router;
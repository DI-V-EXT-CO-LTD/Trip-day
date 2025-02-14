const express = require('express');
const controllerApi = require('../controllers/apiController');


/** API Path Router
*/
const router = express.Router();

router.get('/airport',controllerApi.getAirportCodes)

module.exports = router;
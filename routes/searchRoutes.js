const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// 검색 결과 페이지 라우트
router.get('/search', searchController.search);

module.exports = router;

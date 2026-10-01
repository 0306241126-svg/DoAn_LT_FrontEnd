const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');

// GET /api/profile - Đọc thông tin profile và cài đặt[cite: 2]
router.get('/', getProfile);

// PUT /api/profile - Cập nhật thông tin profile và cài đặt[cite: 2]
router.put('/', updateProfile);

module.exports = router;
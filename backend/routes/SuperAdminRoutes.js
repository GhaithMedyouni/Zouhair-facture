const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/SuperAdminControllers');

// Super Admin Registration Route
router.post('/register', superAdminController.register);

// Super Admin Login Route
router.post('/login', superAdminController.login);
router.get('/admins', superAdminController.getAllAdmins); // New route to get all admins


module.exports = router;

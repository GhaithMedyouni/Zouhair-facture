const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Adjust the path as necessary
const upload = require('../controllers/upload'); 
router.post('/register', adminController.register);
router.get('/confirm/:token', adminController.confirmEmail);
router.post('/login', adminController.login);
router.post('/verify', adminController.verifySession);
router.post('/sendotp', adminController.sendotp);
router.post('/resetpassword', adminController.resetpassword);
router.post('/verfieropt', adminController.verfierOTP);
router.post('/update/:id', upload.single('photo'), adminController.updateAdmin);
module.exports = router;

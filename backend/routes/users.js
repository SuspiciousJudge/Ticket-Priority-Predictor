const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, authorize('admin', 'manager'), userController.getAll);
router.get('/:id', auth, userController.getById);
router.put('/:id', auth, userController.updateUser);
router.get('/:id/tickets', auth, userController.getTickets);
router.get('/:id/performance', auth, userController.getPerformance);

module.exports = router;

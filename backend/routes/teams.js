const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, teamController.getAll);
router.get('/:id', auth, teamController.getById);
router.post('/', auth, authorize('admin', 'manager'), teamController.create);
router.put('/:id', auth, authorize('admin', 'manager'), teamController.update);
router.delete('/:id', auth, authorize('admin'), teamController.remove);
router.post('/:id/members', auth, authorize('admin', 'manager'), teamController.addMember);
router.delete('/:id/members/:userId', auth, authorize('admin', 'manager'), teamController.removeMember);

module.exports = router;

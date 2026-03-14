const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.get('/', auth, teamController.getAll);
router.get('/:id', auth, teamController.getById);
router.post('/', auth, teamController.create);
router.put('/:id', auth, teamController.update);
router.delete('/:id', auth, teamController.remove);
router.post('/:id/members', auth, teamController.addMember);
router.delete('/:id/members/:userId', auth, teamController.removeMember);

module.exports = router;

const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');

router.get('/stats', auth, ticketController.stats);
router.get('/export-csv', auth, ticketController.exportCsv);
router.get('/executive-snapshot', auth, ticketController.executiveSnapshotPdf);
router.get('/:id/similar', auth, ticketController.similar);
router.get('/:id', auth, ticketController.getById);
router.post('/:id/comments', auth, ticketController.addComment);
router.put('/:id', auth, ticketController.update);
router.delete('/:id', auth, ticketController.remove);

router.get('/', auth, ticketController.getAll);
router.post('/', auth, ticketController.create);

module.exports = router;

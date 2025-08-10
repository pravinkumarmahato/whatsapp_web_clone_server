const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const controller = require('../controllers/messageController');

router.get('/conversations', auth, controller.getAllConversations);
router.get('/:id', auth, controller.getMessagesByUser);
router.post('/', auth, controller.postMessage);

module.exports = router;
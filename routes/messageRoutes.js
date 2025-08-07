const express = require('express');
const router = express.Router();
const controller = require('../controllers/messageController');

router.get('/conversations', controller.getAllConversations);
router.get('/:id', controller.getMessagesByUser);
router.post('/', controller.postMessage);

module.exports = router;
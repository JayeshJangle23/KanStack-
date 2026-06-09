const express = require('express');
const router = express.Router();
const controller = require('../controllers/boardController');
const upload = require('../middleware/upload');

router.post('/boards', controller.createBoard);
router.get('/boards', controller.getBoards);
router.get('/boards/:id', controller.getBoardData);
router.post('/boards/:id/invite', controller.inviteMember);
router.get('/boards/:boardId/activities', controller.getActivities);
router.get('/boards/:boardId/analytics', controller.getAnalytics);

router.post('/tasks', controller.createTask);
router.put('/tasks/:id', controller.updateTask);
router.post('/tasks/move', controller.moveTask);
router.delete('/tasks/:id', controller.deleteTask);
router.post('/tasks/:taskId/comments', controller.addComment);
router.get('/tasks/:taskId/comments', controller.getComments);
router.get('/tasks/:taskId/attachments', controller.getAttachments);
router.post('/tasks/:taskId/attachments', upload.single('file'), controller.uploadAttachment);
router.delete('/attachments/:id', controller.deleteAttachment);

module.exports = router;

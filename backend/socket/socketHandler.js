const onlineUsers = new Map();

function setupSocket(io) {
  io.on('connection', (socket) => {
    let currentBoard = null;
    let currentUser = null;

    socket.on('join_board', ({ boardId, userId }) => {
      if (currentBoard) {
        socket.leave(currentBoard);
        removeOnlineUser(currentBoard, socket.id);
      }

      currentBoard = boardId;
      currentUser = userId;
      socket.join(boardId);

      if (!onlineUsers.has(boardId)) {
        onlineUsers.set(boardId, new Map());
      }
      onlineUsers.get(boardId).set(socket.id, { userId, socketId: socket.id });

      io.to(boardId).emit('online_members', getOnlineMembersList(boardId));
      socket.emit('joined_board', { boardId, onlineMembers: getOnlineMembersList(boardId) });
    });

    socket.on('leave_board', () => {
      if (currentBoard) {
        removeOnlineUser(currentBoard, socket.id);
        io.to(currentBoard).emit('online_members', getOnlineMembersList(currentBoard));
        socket.leave(currentBoard);
        currentBoard = null;
        currentUser = null;
      }
    });

    socket.on('task_created', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('task_created', data);
      }
    });

    socket.on('task_updated', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('task_updated', data);
      }
    });

    socket.on('task_moved', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('task_moved', data);
      }
    });

    socket.on('task_deleted', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('task_deleted', data);
      }
    });

    socket.on('member_invited', (data) => {
      if (currentBoard) {
        io.to(currentBoard).emit('member_invited', data);
      }
    });

    socket.on('comment_added', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('comment_added', data);
      }
    });

    socket.on('attachment_added', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('attachment_added', data);
      }
    });

    socket.on('attachment_deleted', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('attachment_deleted', data);
      }
    });

    socket.on('activity_added', (data) => {
      if (currentBoard) {
        socket.to(currentBoard).emit('activity_added', data);
      }
    });

    socket.on('typing_start', ({ taskId }) => {
      if (currentBoard && currentUser) {
        socket.to(currentBoard).emit('typing_start', { taskId, userId: currentUser });
      }
    });

    socket.on('typing_stop', ({ taskId }) => {
      if (currentBoard && currentUser) {
        socket.to(currentBoard).emit('typing_stop', { taskId, userId: currentUser });
      }
    });

    socket.on('request_board_refresh', () => {
      if (currentBoard) {
        socket.to(currentBoard).emit('board_refresh_requested', { requestedBy: currentUser });
      }
    });

    socket.on('disconnect', () => {
      if (currentBoard) {
        removeOnlineUser(currentBoard, socket.id);
        io.to(currentBoard).emit('online_members', getOnlineMembersList(currentBoard));
      }
    });

    socket.on('reconnect_sync', async ({ boardId, lastEventId }) => {
      socket.emit('sync_required', { boardId, reason: 'reconnect' });
    });
  });
}

function removeOnlineUser(boardId, socketId) {
  const boardUsers = onlineUsers.get(boardId);
  if (boardUsers) {
    boardUsers.delete(socketId);
    if (boardUsers.size === 0) {
      onlineUsers.delete(boardId);
    }
  }
}

function getOnlineMembersList(boardId) {
  const boardUsers = onlineUsers.get(boardId);
  if (!boardUsers) return [];

  const uniqueUsers = new Map();
  boardUsers.forEach(({ userId, socketId }) => {
    if (!uniqueUsers.has(userId)) {
      uniqueUsers.set(userId, { userId, socketId });
    }
  });
  return Array.from(uniqueUsers.values());
}

module.exports = setupSocket;

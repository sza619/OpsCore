import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuditRepository } from '../repositories/audit.repository.js';

const auditRepository = new AuditRepository();

export const setupSocketServer = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  const connectedUsers = new Map<string, string>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    connectedUsers.set(socket.id, socket.id);
    io.emit('activeUsers', connectedUsers.size);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      connectedUsers.delete(socket.id);
      io.emit('activeUsers', connectedUsers.size);
    });
  });

  setInterval(async () => {
    try {
      const recentLogs = await auditRepository.getRecentLogs(10);
      io.emit('auditLogs', recentLogs);
    } catch (error) {
      console.error('Error broadcasting audit logs:', error);
    }
  }, 5000);

  setInterval(() => {
    const mockRequests = Math.floor(Math.random() * 50) + 10;
    io.emit('requestsPerMinute', mockRequests);
  }, 3000);

  setInterval(() => {
    const alerts = [
      'High CPU usage detected on server-01',
      'Database connection pool nearly exhausted',
      'Unusual traffic spike detected',
      'Backup completed successfully',
      'SSL certificate expiring in 30 days',
    ];

    if (Math.random() > 0.7) {
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      io.emit('systemAlert', {
        id: Date.now(),
        message: randomAlert,
        severity: Math.random() > 0.5 ? 'warning' : 'info',
        timestamp: new Date(),
      });
    }
  }, 20000);

  return io;
};

export const broadcastAuditLog = (io: SocketServer, log: any) => {
  io.emit('newAuditLog', log);
};

export const broadcastUserUpdate = (io: SocketServer, event: string, data: any) => {
  io.emit(event, data);
};

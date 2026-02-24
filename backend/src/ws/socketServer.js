import { WebSocketServer } from 'ws';

export const attachWebsocket = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ event: 'system.connected', payload: { message: 'Connected to healthcare realtime bus' } }));
  });

  const broadcast = (event, payload) => {
    const body = JSON.stringify({ event, payload });
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(body);
    }
  };

  return { wss, broadcast };
};

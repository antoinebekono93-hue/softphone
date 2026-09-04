import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Configuration Serveur (lazy — ne crash pas si les env vars manquent)
let _pusherServer: PusherServer | null = null;
export function getPusherServer(): PusherServer | null {
  if (_pusherServer) return _pusherServer;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  if (!appId || !key || !secret) {
    console.warn("[Pusher] Server env vars missing — Pusher server disabled");
    return null;
  }
  _pusherServer = new PusherServer({
    appId,
    key,
    secret,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
    useTLS: true,
  });
  return _pusherServer;
}

// Configuration Client (lazy)
export const getPusherClient = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) return null;
  return new PusherClient(key, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  });
};

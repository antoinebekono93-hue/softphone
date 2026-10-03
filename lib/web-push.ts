import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.NEXT_PUBLIC_APP_URL || "mailto:support@antigravity.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("VAPID keys not set. Web Push notifications will not work.");
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  actions?: { action: string; title: string; icon?: string }[];
}

export async function sendPushNotificationToUser(userId: string, payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("Cannot send push notification: VAPID keys missing");
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return;
  }

  const payloadString = JSON.stringify(payload);

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payloadString
      );
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // L'abonnement a expiré ou n'est plus valide, on le supprime
        console.log(`Push subscription ${sub.endpoint} expired, removing from DB.`);
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      } else {
        console.error("Error sending push notification:", error);
      }
    }
  });

  await Promise.all(sendPromises);
}

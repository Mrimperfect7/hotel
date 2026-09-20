/**
 * Firebase Cloud Messaging (FCM) Push Notification Sender.
 *
 * Uses the Firebase Admin SDK to deliver push notifications to mobile/web device tokens.
 * Automatically initializes using credentials from FIREBASE_PROJECT_ID,
 * FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.
 */
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { config } from '@gsv/config';

let firebaseApp: App | null = null;

function getFirebaseMessaging(): Messaging | null {
  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    if (!firebaseApp) {
      const existing = getApps();
      if (existing.length > 0) {
        firebaseApp = existing[0]!;
      } else {
        const formattedKey = privateKey.includes('\\n')
          ? privateKey.replace(/\\n/g, '\n')
          : privateKey;

        firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: formattedKey,
          }),
        });
      }
    }

    return getMessaging(firebaseApp);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[PUSH (FCM)] Initialization error:', err);
    return null;
  }
}

/**
 * Send a push notification to a device token via Firebase Cloud Messaging.
 */
export async function sendFirebasePush(
  token: string,
  title: string,
  body: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    // eslint-disable-next-line no-console
    console.log(`[PUSH (Mock/No Firebase Config) → ${token}] ${title} — ${body}`);
    return;
  }

  try {
    const stringData: Record<string, string> = {};
    if (meta) {
      for (const [k, v] of Object.entries(meta)) {
        stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }

    const response = await messaging.send({
      token,
      notification: {
        title,
        body,
      },
      data: stringData,
    });
    // eslint-disable-next-line no-console
    console.log(`[PUSH (FCM) → ${token}] Sent successfully: ${response}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[PUSH (FCM) → ${token}] Failed to send notification:`, err);
  }
}

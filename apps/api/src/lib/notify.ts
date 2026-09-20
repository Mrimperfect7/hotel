/**
 * Notification dispatcher.
 *
 * In-app rows are always written (dashboard/notification center + mobile).
 * Email / SMS / WhatsApp / Push use provider ABSTRACTIONS with console
 * adapters until real provider keys are configured (Resend, gupshup, WA
 * Business API, FCM). Swapping in a provider = implement one class, no call
 * site changes.
 */
import { prisma, type NotificationType } from '@gsv/database';
import { config } from '@gsv/config';
import { sendGupshupWhatsApp } from './whatsapp-gupshup.js';
import { sendFirebasePush } from './push-firebase.js';

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channels?: Array<'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH'>;
  meta?: Record<string, unknown>;
};

type ChannelSender = (to: string, title: string, body: string, meta?: Record<string, unknown>) => Promise<void>;

const consoleSender =
  (channel: string): ChannelSender =>
  async (to, title, body) => {
    // eslint-disable-next-line no-console
    console.log(`[${channel} → ${to}] ${title} — ${body}`);
  };

/** Gupshup WhatsApp sender — used when WHATSAPP_PROVIDER=gupshup */
const gupshupSender: ChannelSender = async (to, title, body) => {
  const message = `*${title}*\n${body}`;
  await sendGupshupWhatsApp(to, message);
};

/** Firebase Cloud Messaging push sender */
const pushSender: ChannelSender = async (to, title, body, meta) => {
  await sendFirebasePush(to, title, body, meta);
};

const senders: Record<'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH', ChannelSender> = {
  EMAIL: consoleSender('EMAIL'),
  SMS: consoleSender('SMS'),
  WHATSAPP: config.whatsappProvider === 'gupshup' ? gupshupSender : consoleSender('WHATSAPP'),
  PUSH: pushSender,
};

export async function notify(input: NotifyInput): Promise<void> {
  const channels = input.channels ?? ['IN_APP'];
  if (channels.includes('IN_APP')) {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        meta: input.meta as object | undefined,
        channel: 'IN_APP',
      },
    });
  }
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, phone: true } });
  if (!user) return;

  if (channels.includes('EMAIL') && user.email && config.emailProvider !== 'console') {
    await senders.EMAIL(user.email, input.title, input.body, input.meta);
  } else if (channels.includes('EMAIL')) {
    await senders.EMAIL(user.email ?? 'no-email', input.title, input.body, input.meta);
  }
  if (channels.includes('SMS') && user.phone) await senders.SMS(user.phone, input.title, input.body, input.meta);
  if (channels.includes('WHATSAPP') && user.phone) await senders.WHATSAPP(user.phone, input.title, input.body, input.meta);
  if (channels.includes('PUSH')) {
    const tokens = await prisma.deviceToken.findMany({ where: { userId: input.userId } });
    for (const t of tokens) await senders.PUSH(t.token, input.title, input.body, input.meta);
  }
}

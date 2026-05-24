import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { ApiError, AuthUser } from './auth';

export type SystemSettings = {
  primaryCurrency: 'OMR';
  secondaryCurrency: 'USD';
  omrToUsdRate: number;
  showUsdEquivalent: boolean;
};

export type NotificationPreferences = {
  inAppDueReminders: boolean;
  inAppOverdueAlerts: boolean;
  inAppAssignments: boolean;
  inAppCompletions: boolean;
  emailReminders: boolean;
};

const SYSTEM_SETTINGS_KEY = 'system';
const NOTIFICATION_PREFERENCES_KEY = 'notifications';

export const defaultSystemSettings: SystemSettings = {
  primaryCurrency: 'OMR',
  secondaryCurrency: 'USD',
  omrToUsdRate: 2.6,
  showUsdEquivalent: true,
};

export const defaultNotificationPreferences: NotificationPreferences = {
  inAppDueReminders: true,
  inAppOverdueAlerts: true,
  inAppAssignments: true,
  inAppCompletions: true,
  emailReminders: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSystemSettings(value: unknown): SystemSettings {
  if (!isRecord(value)) return defaultSystemSettings;
  const rate = Number(value.omrToUsdRate);
  return {
    primaryCurrency: 'OMR',
    secondaryCurrency: 'USD',
    omrToUsdRate: Number.isFinite(rate) && rate > 0 ? rate : defaultSystemSettings.omrToUsdRate,
    showUsdEquivalent:
      typeof value.showUsdEquivalent === 'boolean'
        ? value.showUsdEquivalent
        : defaultSystemSettings.showUsdEquivalent,
  };
}

function normalizeNotificationPreferences(value: unknown): NotificationPreferences {
  if (!isRecord(value)) return defaultNotificationPreferences;
  return {
    inAppDueReminders:
      typeof value.inAppDueReminders === 'boolean'
        ? value.inAppDueReminders
        : defaultNotificationPreferences.inAppDueReminders,
    inAppOverdueAlerts:
      typeof value.inAppOverdueAlerts === 'boolean'
        ? value.inAppOverdueAlerts
        : defaultNotificationPreferences.inAppOverdueAlerts,
    inAppAssignments:
      typeof value.inAppAssignments === 'boolean'
        ? value.inAppAssignments
        : defaultNotificationPreferences.inAppAssignments,
    inAppCompletions:
      typeof value.inAppCompletions === 'boolean'
        ? value.inAppCompletions
        : defaultNotificationPreferences.inAppCompletions,
    emailReminders:
      typeof value.emailReminders === 'boolean'
        ? value.emailReminders
        : defaultNotificationPreferences.emailReminders,
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: SYSTEM_SETTINGS_KEY } });
  return normalizeSystemSettings(setting?.value);
}

export async function updateSystemSettings(body: Record<string, unknown>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const rate = body.omrToUsdRate === undefined ? current.omrToUsdRate : Number(body.omrToUsdRate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new ApiError(400, 'OMR to USD rate must be greater than zero');
  }

  const next: SystemSettings = {
    primaryCurrency: 'OMR',
    secondaryCurrency: 'USD',
    omrToUsdRate: rate,
    showUsdEquivalent:
      typeof body.showUsdEquivalent === 'boolean'
        ? body.showUsdEquivalent
        : current.showUsdEquivalent,
  };

  await prisma.systemSetting.upsert({
    where: { key: SYSTEM_SETTINGS_KEY },
    update: { value: next as unknown as Prisma.InputJsonValue },
    create: { key: SYSTEM_SETTINGS_KEY, value: next as unknown as Prisma.InputJsonValue },
  });

  return next;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key: NOTIFICATION_PREFERENCES_KEY } },
  });
  return normalizeNotificationPreferences(pref?.value);
}

export async function updateNotificationPreferences(
  user: AuthUser,
  body: Record<string, unknown>,
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(user.id);
  const next = normalizeNotificationPreferences({ ...current, ...body });

  await prisma.userPreference.upsert({
    where: { userId_key: { userId: user.id, key: NOTIFICATION_PREFERENCES_KEY } },
    update: { value: next as unknown as Prisma.InputJsonValue },
    create: {
      userId: user.id,
      key: NOTIFICATION_PREFERENCES_KEY,
      value: next as unknown as Prisma.InputJsonValue,
    },
  });

  return next;
}

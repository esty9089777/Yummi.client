import { INotification } from '../models/notification.model';

type NotificationPayload =
  | INotification
  | {
      message: string;
      type: string;
      orderId?: string;
      ingredientId?: string;
      ingredientName?: string;
      notification?: INotification | Record<string, unknown>;
    };

export function normalizeNotification(raw: unknown): INotification | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const payload = raw as NotificationPayload;

  if ('notification' in payload && payload.notification) {
    return normalizeNotification(payload.notification);
  }

  if ('_id' in payload && 'recipient' in payload && 'message' in payload && 'type' in payload) {
    const notification = payload as INotification;
    return {
      ...notification,
      _id: String(notification._id),
      recipient: String(notification.recipient),
      data: normalizeNotificationData(notification.data),
      createdAt: String(notification.createdAt),
      updatedAt: String(notification.updatedAt),
    };
  }

  if ('message' in payload && 'type' in payload) {
    const partial = payload as {
      message: string;
      type: string;
      orderId?: string;
      ingredientId?: string;
      ingredientName?: string;
    };

    return {
      _id: `local-${Date.now()}`,
      recipient: '',
      type: partial.type,
      message: partial.message,
      data: {
        ...(partial.orderId ? { orderId: partial.orderId } : {}),
        ...(partial.ingredientId ? { ingredientId: partial.ingredientId } : {}),
        ...(partial.ingredientName ? { ingredientName: partial.ingredientName } : {}),
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

export function normalizeNotificationData(
  data: INotification['data'] | Record<string, unknown> | undefined,
): INotification['data'] {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const record = data as Record<string, unknown>;
  const normalized: NonNullable<INotification['data']> = {};

  if (record['orderId']) {
    normalized.orderId = String(record['orderId']);
  }
  if (record['ingredientId']) {
    normalized.ingredientId = String(record['ingredientId']);
  }
  if (record['ingredientName']) {
    normalized.ingredientName = String(record['ingredientName']);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function isKitchenIssueNotification(notification: INotification): boolean {
  return (
    notification.type.includes('KITCHEN_ISSUE') || notification.type.includes('SHORTAGE')
  );
}

export function getNotificationIngredientId(notification: INotification): string | null {
  const ingredientId = notification.data?.ingredientId;
  return ingredientId ? String(ingredientId) : null;
}

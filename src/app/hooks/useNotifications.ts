import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../utils/firebase/config";

export type NotificationType = "order" | "appointment" | "inquiry";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  statusRefId: string;
  relatedId?: string;
  read: boolean;
  createdAt?: Timestamp | string | null;
}

function getTime(value: unknown): number {
  if (!value) return 0;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function normalizeNotification(id: string, data: any): AppNotification {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",

    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title
        : "Notification",

    message:
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : "You have a new update.",

    type:
      data.type === "order" ||
      data.type === "appointment" ||
      data.type === "inquiry"
        ? data.type
        : "order",

    statusRefId:
      typeof data.statusRefId === "string"
        ? data.statusRefId
        : typeof data.relatedId === "string"
        ? data.relatedId
        : "",

    relatedId: typeof data.relatedId === "string" ? data.relatedId : "",

    read: data.read === true,
    createdAt: data.createdAt ?? null,
  };
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((d) => normalizeNotification(d.id, d.data()))
          .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

        setNotifications(mapped);
        setLoading(false);
      },
      (error) => {
        console.error("Notifications listener error:", error);
        setNotifications([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = async (notificationId: string) => {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;

    const batch = writeBatch(db);

    unread.forEach((item) => {
      batch.update(doc(db, "notifications", item.id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
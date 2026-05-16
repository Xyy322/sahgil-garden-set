import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../utils/firebase/config";

export type NotificationType =
  | "order"
  | "appointment"
  | "inquiry";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  statusRefId: string;
  read: boolean;
  createdAt?: Timestamp;
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
  .map((d) => {
    const data = d.data() as Omit<AppNotification, "id">;

    return {
      id: d.id,
      ...data,
      read: data.read ?? false, // single source of truth
    } as AppNotification;
  })
          .sort((a, b) => {
            const aMs = a.createdAt?.toMillis?.() ?? 0;
            const bMs = b.createdAt?.toMillis?.() ?? 0;
            return bMs - aMs;
          });

        setNotifications(mapped);
        setLoading(false);
      },
      () => {
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
    });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;

    const batch = writeBatch(db);
    unread.forEach((item) => {
      batch.update(doc(db, "notifications", item.id), { read: true });
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
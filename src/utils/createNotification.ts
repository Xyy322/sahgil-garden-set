import { db } from "./firebase/config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export type NotificationType = "order" | "appointment" | "inquiry";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  statusRefId: string;
}

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  statusRefId,
}: CreateNotificationParams) => {
  await addDoc(collection(db, "notifications"), {
    userId,
    title,
    message,
    type,

    // New expected field
    statusRefId,

    // Keep this for compatibility with older code
    relatedId: statusRefId,

    relatedCollection:
      type === "order"
        ? "orders"
        : type === "appointment"
        ? "appointments"
        : "inquiries",

    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
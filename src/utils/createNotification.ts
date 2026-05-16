import { db } from "./firebase/config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export type NotificationType =
  | "order"
  | "appointment"
  | "inquiry";

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
    statusRefId,

    // IMPORTANT
    read: false,

    createdAt: serverTimestamp(),
  });
};
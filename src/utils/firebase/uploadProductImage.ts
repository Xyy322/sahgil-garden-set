import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadProductImage(file: File): Promise<string> {
  if (!file) throw new Error("No file selected");

  const fileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `product/${fileName}`);

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}
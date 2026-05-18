import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function uploadProductImage(file: File): Promise<string> {
  if (!file) {
    throw new Error("No image file selected.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const storageRef = ref(storage, `product-images/${fileName}`);

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}
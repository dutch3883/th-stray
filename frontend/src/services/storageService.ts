// src/services/storageService.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';

const storage = getStorage(app);

/**
 * Upload a File to Cloud Storage under the given path,
 * and return its public download URL.
 */
export async function uploadImageAndGetUrl(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  // uploadBytes will use your Firebase Auth token under the hood
  await uploadBytes(storageRef, file);
  // once uploaded, get a public URL
  return getDownloadURL(storageRef);
}
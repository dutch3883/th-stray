// src/services/storageService.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';

const storage = getStorage(app);

/**
 * Upload a File to Cloud Storage under the given path,
 * and return its public download URL.
 */
export async function uploadImageAndGetUrl(path: string, file: File): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}
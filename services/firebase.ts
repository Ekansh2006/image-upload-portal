import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadImageToFirebase = async (imageUri: string, fileName: string): Promise<string> => {
  try {
    // Create a reference to the file location
    const imageRef = ref(storage, `images/${Date.now()}_${fileName}`);
    
    let blob: Blob;
    
    if (imageUri.startsWith('data:')) {
      // Handle base64 data URLs (from web drag & drop)
      const response = await fetch(imageUri);
      blob = await response.blob();
    } else {
      // Handle file URIs (from mobile image picker)
      const response = await fetch(imageUri);
      blob = await response.blob();
    }
    
    // Upload the file
    const snapshot = await uploadBytes(imageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw new Error('Failed to upload image to Firebase');
  }
};

export { storage };
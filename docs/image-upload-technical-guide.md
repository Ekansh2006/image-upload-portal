# Image Upload with Firebase Storage - Technical Guide

## Overview

This guide explains how to implement drag-and-drop and click-to-upload image functionality in a React Native app using Firebase Storage. The implementation supports both web and mobile platforms with proper error handling and user feedback.

## Architecture

### Components Structure
```
app/
├── (tabs)/
│   └── gallery.tsx          # Main gallery screen with upload functionality
├── components/
│   ├── ImageUploader.tsx     # Reusable upload component
│   └── ImageGrid.tsx         # Display uploaded images
└── services/
    └── firebase.ts           # Firebase configuration and storage functions
```

## Technical Implementation

### 1. Firebase Storage Setup

**File: `services/firebase.ts`**

The Firebase service handles:
- Storage initialization
- Image upload with progress tracking
- Error handling
- File validation

```typescript
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadImage = async (
  file: File | Blob,
  fileName: string,
  onProgress?: (progress: number) => void
) => {
  const storageRef = ref(storage, `images/${fileName}`);
  
  if (onProgress) {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        reject,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } else {
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
};
```

### 2. Cross-Platform Image Upload Component

**File: `components/ImageUploader.tsx`**

Handles both web drag-and-drop and mobile image picker:

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/services/firebase';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Web drag and drop handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  // Mobile image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await handleImageUpload(result.assets[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, file.name, setProgress);
      onUploadComplete(url);
    } catch (error) {
      Alert.alert('Upload failed', error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <View>
      {Platform.OS === 'web' ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: '2px dashed #ccc',
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <Text>Drag and drop images here or click to upload</Text>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
      ) : (
        <TouchableOpacity onPress={pickImage}>
          <Text>Tap to upload image</Text>
        </TouchableOpacity>
      )}
      
      {uploading && (
        <View>
          <Text>Uploading: {Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};
```

### 3. State Management with Context

**File: `contexts/ImageContext.tsx`**

Manages uploaded images state across the app:

```typescript
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ImageData {
  id: string;
  url: string;
  uploadedAt: Date;
  fileName: string;
}

export const [ImageContext, useImages] = createContextHook(() => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load images from AsyncStorage on app start
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const stored = await AsyncStorage.getItem('uploaded_images');
      if (stored) {
        setImages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const addImage = async (url: string, fileName: string) => {
    const newImage: ImageData = {
      id: Date.now().toString(),
      url,
      fileName,
      uploadedAt: new Date()
    };
    
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    
    // Persist to AsyncStorage
    await AsyncStorage.setItem('uploaded_images', JSON.stringify(updatedImages));
  };

  const removeImage = async (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    await AsyncStorage.setItem('uploaded_images', JSON.stringify(updatedImages));
  };

  return {
    images,
    loading,
    addImage,
    removeImage,
    loadImages
  };
});
```

## Platform-Specific Considerations

### Web Implementation
- Uses HTML5 drag-and-drop API
- File input for click-to-upload
- Direct File object handling
- CSS styling for drop zones

### Mobile Implementation
- Uses expo-image-picker for native image selection
- Handles image URI conversion
- Platform-specific permissions
- Native UI components

## Security & Validation

### File Validation
```typescript
const validateFile = (file: File) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
  }
};
```

### Firebase Security Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{imageId} {
      allow read, write: if request.auth != null
        && resource.size < 5 * 1024 * 1024
        && resource.contentType.matches('image/.*');
    }
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Network failures**: Retry mechanism with exponential backoff
2. **File size limits**: Client-side validation before upload
3. **Invalid file types**: MIME type checking
4. **Storage quota**: Graceful degradation
5. **Permission errors**: User-friendly error messages

### Implementation
```typescript
const handleUploadError = (error: any) => {
  let message = 'Upload failed. Please try again.';
  
  if (error.code === 'storage/quota-exceeded') {
    message = 'Storage quota exceeded. Please contact support.';
  } else if (error.code === 'storage/unauthorized') {
    message = 'You are not authorized to upload files.';
  } else if (error.code === 'storage/canceled') {
    message = 'Upload was canceled.';
  }
  
  Alert.alert('Upload Error', message);
};
```

## Performance Optimization

### Image Compression
```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }], // Resize to max width of 1024px
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  return result.uri;
};
```

### Lazy Loading
```typescript
const ImageGrid = () => {
  return (
    <FlatList
      data={images}
      renderItem={({ item }) => (
        <Image
          source={{ uri: item.url }}
          style={{ width: 100, height: 100 }}
          resizeMode="cover"
        />
      )}
      numColumns={3}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={10}
    />
  );
};
```

## Testing Strategy

### Unit Tests
- Firebase service functions
- Image validation logic
- Context state management

### Integration Tests
- Upload flow end-to-end
- Error handling scenarios
- Platform-specific behaviors

### Manual Testing Checklist
- [ ] Drag and drop on web
- [ ] Click to upload on web
- [ ] Tap to upload on mobile
- [ ] Progress indication
- [ ] Error handling
- [ ] Image display
- [ ] Persistence across app restarts

## Deployment Considerations

### Firebase Configuration
1. Set up Firebase project
2. Enable Storage service
3. Configure security rules
4. Set up authentication (if required)
5. Configure CORS for web access

### Environment Variables
```typescript
// app.config.js
export default {
  expo: {
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    }
  }
};
```

## Monitoring & Analytics

### Upload Metrics
- Success/failure rates
- Upload duration
- File sizes
- Error types and frequency

### Implementation
```typescript
const trackUpload = (success: boolean, duration: number, fileSize: number) => {
  // Analytics implementation
  console.log('Upload metrics:', { success, duration, fileSize });
};
```

This implementation provides a robust, cross-platform image upload solution with proper error handling, performance optimization, and security considerations.
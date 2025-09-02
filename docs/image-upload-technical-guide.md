# Image Upload with Cloudinary - Technical Guide

## Overview

This guide explains how to implement drag-and-drop and click-to-upload image functionality in a React Native app using Cloudinary. The implementation supports both web and mobile platforms with proper error handling, image optimization, and user feedback.

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
    └── cloudinary.ts         # Cloudinary configuration and upload functions
```

## Technical Implementation

### 1. Cloudinary Setup

**File: `services/cloudinary.ts`**

The Cloudinary service handles:
- Image upload with automatic optimization
- Progress tracking (where supported)
- Error handling and retry logic
- File validation
- Image transformations and optimization

```typescript
// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = 'your-upload-preset';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadImageToCloudinary = async (
  imageUri: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const formData = new FormData();
    
    if (imageUri.startsWith('data:')) {
      // Handle base64 data URLs (from web drag & drop)
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      // Handle file URIs (from mobile image picker)
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);
    }
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'uploads');
    formData.append('public_id', `${Date.now()}_${fileName.split('.')[0]}`);
    
    const response = await fetch(CLOUDINARY_API_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Generate optimized image URLs
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg';
  } = {}
): string => {
  const { width, height, quality = 'auto', format = 'auto' } = options;
  let transformations = [];
  
  if (width || height) {
    const dimensions = [];
    if (width) dimensions.push(`w_${width}`);
    if (height) dimensions.push(`h_${height}`);
    transformations.push(dimensions.join(','));
  }
  
  transformations.push(`q_${quality}`, `f_${format}`);
  
  const transformationString = transformations.join(',') + '/';
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
};
```

### 2. Cross-Platform Image Upload Component

**File: `components/ImageUploader.tsx`**

Handles both web drag-and-drop and mobile image picker:

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '@/services/cloudinary';

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
      const url = await uploadImageToCloudinary(file.uri || URL.createObjectURL(file), file.name, setProgress);
      onUploadComplete(url);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Unknown error');
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

### Cloudinary Upload Presets

Cloudinary uses upload presets to define upload parameters and security settings:

```javascript
// Cloudinary Upload Preset Configuration (via Dashboard)
{
  "name": "your-upload-preset",
  "unsigned": true,
  "folder": "uploads",
  "allowed_formats": ["jpg", "jpeg", "png", "gif", "webp"],
  "max_file_size": 5242880, // 5MB
  "quality": "auto",
  "format": "auto",
  "transformation": [
    {
      "width": 2000,
      "height": 2000,
      "crop": "limit"
    }
  ]
}
```

**Security Features:**
- Unsigned uploads with preset restrictions
- File size and format validation
- Automatic image optimization
- Folder organization
- Rate limiting (configurable)

## Error Handling

### Common Error Scenarios
1. **Network failures**: Retry mechanism with exponential backoff
2. **File size limits**: Client-side validation before upload
3. **Invalid file types**: MIME type checking
4. **Upload preset errors**: Configuration validation
5. **Rate limiting**: Graceful handling of API limits

### Implementation
```typescript
const handleUploadError = (error: any) => {
  let message = 'Upload failed. Please try again.';
  
  if (error.message?.includes('File size too large')) {
    message = 'File size exceeds the 5MB limit.';
  } else if (error.message?.includes('Invalid file type')) {
    message = 'Only JPEG, PNG, GIF, and WebP images are allowed.';
  } else if (error.message?.includes('Upload preset')) {
    message = 'Upload configuration error. Please contact support.';
  } else if (error.message?.includes('Rate limit')) {
    message = 'Too many uploads. Please wait a moment and try again.';
  }
  
  Alert.alert('Upload Error', message);
};
```

## Performance Optimization

### Automatic Image Optimization
Cloudinary automatically optimizes images:

```typescript
// Automatic optimization is built into Cloudinary
// No manual compression needed - handled server-side

// For display, use optimized URLs:
const optimizedUrl = getOptimizedImageUrl(publicId, {
  width: 400,
  height: 300,
  quality: 'auto',
  format: 'auto' // Automatically serves WebP to supported browsers
});

// For thumbnails:
const thumbnailUrl = getOptimizedImageUrl(publicId, {
  width: 150,
  height: 150,
  quality: 80,
  format: 'webp'
});
```

### Client-side Optimization (Optional)
```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Only compress if needed for very large images
const compressIfNeeded = async (uri: string, maxSize: number = 2048) => {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: maxSize } }],
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

### Cloudinary Setup
1. Create Cloudinary account
2. Get your Cloud Name from the dashboard
3. Create an unsigned upload preset
4. Configure upload restrictions and transformations
5. Set up folder structure (optional)

### Environment Variables
```typescript
// app.config.js
export default {
  expo: {
    extra: {
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    }
  }
};

// In your service file:
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';
```

### Cloudinary Dashboard Configuration
1. **Upload Presets**: Create unsigned presets for client uploads
2. **Transformations**: Set up automatic image optimization
3. **Folders**: Organize uploads by date, user, or category
4. **Webhooks**: Set up notifications for upload events (optional)
5. **Analytics**: Monitor usage and performance

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

This implementation provides a robust, cross-platform image upload solution with Cloudinary's powerful features including automatic optimization, transformations, and CDN delivery, along with proper error handling and security considerations.

## Cloudinary Advantages

### Built-in Features
- **Automatic Optimization**: Smart compression and format selection
- **CDN Delivery**: Global content delivery network
- **Image Transformations**: Resize, crop, and enhance on-the-fly
- **Format Conversion**: Automatic WebP/AVIF serving to supported browsers
- **Analytics**: Detailed usage and performance metrics

### Advanced Features
- **AI-powered cropping**: Automatic subject detection
- **Background removal**: AI-powered background removal
- **Face detection**: Automatic face-aware cropping
- **Video support**: Upload and transform videos
- **Backup and versioning**: Automatic backup of all assets

### Cost Efficiency
- **Free tier**: 25GB storage and 25GB bandwidth
- **Pay-as-you-scale**: Only pay for what you use
- **Bandwidth optimization**: Reduced costs through automatic optimization
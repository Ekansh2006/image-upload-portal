import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Image as ImageIcon, X, Camera, FolderOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadImageToFirebase } from '@/services/firebase';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
}

export default function ImageUploadScreen() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = useCallback(async (uri: string, fileName: string) => {
    try {
      setUploading(true);
      const downloadURL = await uploadImageToFirebase(uri, fileName);
      
      const newImage: UploadedImage = {
        id: Date.now().toString(),
        url: downloadURL,
        name: fileName,
        uploadedAt: new Date(),
      };
      
      setUploadedImages(prev => [newImage, ...prev]);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        await handleImageUpload(asset.uri, fileName);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [handleImageUpload]);

  const removeImage = useCallback((id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Web-specific drag and drop handlers
  const handleDragOver = useCallback((e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      setDragActive(false);
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            await handleImageUpload(dataUrl, file.name);
          };
          reader.readAsDataURL(file);
        } else {
          Alert.alert('Error', 'Please select an image file');
        }
      }
    }
  }, [handleImageUpload]);

  const screenWidth = Dimensions.get('window').width;
  const imageSize = (screenWidth - 60) / 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload</Text>
        <Text style={styles.subtitle}>Upload your images to Firebase Storage</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

      {/* Upload Zone */}
      <TouchableOpacity
        style={[
          styles.uploadZone,
          dragActive && styles.uploadZoneActive,
          uploading && styles.uploadZoneUploading,
        ]}
        onPress={pickImage}
        disabled={uploading}
        {...(Platform.OS === 'web' && {
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
        })}
      >
        <View style={styles.uploadContent}>
          {uploading ? (
            <>
              <View style={styles.uploadingIcon}>
                <Upload size={32} color="#007AFF" />
              </View>
              <Text style={styles.uploadingText}>Uploading...</Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <ImageIcon size={48} color="#007AFF" />
              </View>
              <Text style={styles.uploadText}>
                {Platform.OS === 'web' ? 'Drag & drop images here or click to browse' : 'Tap to select images'}
              </Text>
              <Text style={styles.uploadSubtext}>
                Supports JPG, PNG, GIF up to 10MB
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Uploaded Images Gallery */}
      {uploadedImages.length > 0 && (
        <View style={styles.gallerySection}>
          <Text style={styles.galleryTitle}>Uploaded Images ({uploadedImages.length})</Text>
          <View style={styles.gallery}>
            {uploadedImages.map((image) => (
              <View key={image.id} style={[styles.imageCard, { width: imageSize, height: imageSize }]}>
                <Image
                  source={{ uri: image.url }}
                  style={styles.image}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(image.id)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
                <View style={styles.imageInfo}>
                  <Text style={styles.imageName} numberOfLines={1}>
                    {image.name}
                  </Text>
                  <Text style={styles.imageDate}>
                    {image.uploadedAt.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={pickImage}>
            <FolderOpen size={24} color="#007AFF" />
            <Text style={styles.quickActionText}>Choose from Library</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={() => Alert.alert('Camera', 'Camera feature coming soon!')}
          >
            <Camera size={24} color="#007AFF" />
            <Text style={styles.quickActionText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {uploadedImages.length === 0 && !uploading && (
          <View style={styles.emptyState}>
            <ImageIcon size={64} color="#ccc" />
            <Text style={styles.emptyText}>No images uploaded yet</Text>
            <Text style={styles.emptySubtext}>Start by uploading your first image</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 32,
    minHeight: 200,
  },
  uploadZoneActive: {
    borderColor: '#34C759',
    backgroundColor: '#f0fff4',
  },
  uploadZoneUploading: {
    borderColor: '#FF9500',
    backgroundColor: '#fff8f0',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  gallerySection: {
    marginTop: 20,
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  imageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  imageDate: {
    fontSize: 10,
    color: '#ccc',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
});
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Search, Grid, List, Download, Share2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GalleryImage {
  id: string;
  url: string;
  name: string;
  uploadedAt: Date;
  size?: string;
}

export default function GalleryScreen() {
  const [images] = useState<GalleryImage[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      name: 'Mountain Landscape',
      uploadedAt: new Date('2024-01-15'),
      size: '2.4 MB'
    },
    {
      id: '2', 
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      name: 'Forest Path',
      uploadedAt: new Date('2024-01-14'),
      size: '1.8 MB'
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400', 
      name: 'Lake View',
      uploadedAt: new Date('2024-01-13'),
      size: '3.1 MB'
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      name: 'Sunset Hills',
      uploadedAt: new Date('2024-01-12'),
      size: '2.7 MB'
    },
  ]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const screenWidth = Dimensions.get('window').width;
  const imageSize = viewMode === 'grid' ? (screenWidth - 60) / 2 : screenWidth - 40;

  const renderGridView = () => (
    <View style={styles.gallery}>
      {images.map((image) => (
        <TouchableOpacity
          key={image.id}
          style={[styles.imageCard, { width: imageSize, height: imageSize }]}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: image.url }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageName} numberOfLines={1}>
              {image.name}
            </Text>
            <Text style={styles.imageSize}>{image.size}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      {images.map((image) => (
        <TouchableOpacity key={image.id} style={styles.listItem} activeOpacity={0.8}>
          <Image
            source={{ uri: image.url }}
            style={styles.listImage}
            contentFit="cover"
          />
          <View style={styles.listContent}>
            <Text style={styles.listTitle}>{image.name}</Text>
            <Text style={styles.listDate}>
              {image.uploadedAt.toLocaleDateString()}
            </Text>
            <Text style={styles.listSize}>{image.size}</Text>
          </View>
          <View style={styles.listActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Download size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.subtitle}>{images.length} images</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color="#666" />
          <Text style={styles.searchText}>Search images...</Text>
        </TouchableOpacity>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'grid' && styles.toggleButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid size={18} color={viewMode === 'grid' ? '#fff' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={18} color={viewMode === 'list' ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'grid' ? renderGridView() : renderListView()}
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  searchText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
  imageOverlay: {
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
  imageSize: {
    fontSize: 10,
    color: '#ccc',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  listSize: {
    fontSize: 12,
    color: '#999',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f8ff',
  },
});
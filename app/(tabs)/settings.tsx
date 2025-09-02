import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  Settings as SettingsIcon,
  User,
  Database,
  Shield,
  Bell,
  Palette,
  HelpCircle,
  Info,
  ChevronRight,
  Trash2,
  Download,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  const [autoUpload, setAutoUpload] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [highQuality, setHighQuality] = useState(true);

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: 'Manage your account settings',
          icon: <User size={20} color="#007AFF" />,
          type: 'navigation' as const,
          onPress: () => Alert.alert('Profile', 'Profile settings coming soon!'),
        },
      ],
    },
    {
      title: 'Upload Settings',
      items: [
        {
          id: 'auto-upload',
          title: 'Auto Upload',
          subtitle: 'Automatically upload selected photos',
          icon: <Database size={20} color="#34C759" />,
          type: 'toggle' as const,
          value: autoUpload,
          onPress: () => setAutoUpload(!autoUpload),
        },
        {
          id: 'high-quality',
          title: 'High Quality Upload',
          subtitle: 'Upload images in original quality',
          icon: <Palette size={20} color="#FF9500" />,
          type: 'toggle' as const,
          value: highQuality,
          onPress: () => setHighQuality(!highQuality),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get notified about upload status',
          icon: <Bell size={20} color="#FF3B30" />,
          type: 'toggle' as const,
          value: notifications,
          onPress: () => setNotifications(!notifications),
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Download all your uploaded images',
          icon: <Download size={20} color="#007AFF" />,
          type: 'action' as const,
          onPress: () => Alert.alert('Export', 'Export feature coming soon!'),
        },
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: <Trash2 size={20} color="#FF9500" />,
          type: 'action' as const,
          onPress: () => {
            Alert.alert(
              'Clear Cache',
              'This will clear all cached images. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => {} },
              ]
            );
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with using the app',
          icon: <HelpCircle size={20} color="#007AFF" />,
          type: 'navigation' as const,
          onPress: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          icon: <Info size={20} color="#666" />,
          type: 'navigation' as const,
          onPress: () => Alert.alert('About', 'Image Upload App v1.0.0\nBuilt with React Native & Expo'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, item.destructive && styles.destructiveItem]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingIcon}>
          {item.icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <View style={styles.settingAction}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onPress}
              trackColor={{ false: '#e5e5e5', true: '#007AFF' }}
              thumbColor={item.value ? '#fff' : '#f4f3f4'}
            />
          )}
          {item.type === 'navigation' && (
            <ChevronRight size={20} color="#c7c7cc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {settingSections.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ using React Native</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  destructiveItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingAction: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});
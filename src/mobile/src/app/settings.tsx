import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Appearance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ChevronLeft, ChevronRight, Globe, Moon } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

interface LanguageOption {
  code: string;
  labelKey: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', labelKey: 'title.english' },
  { code: 'mm', labelKey: 'title.myanmar' },
  { code: 'th', labelKey: 'title.thai' },
  { code: 'zh', labelKey: 'title.chinese' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleLanguageSelect = (code: string) => {
    i18n.changeLanguage(code);
    setLanguageModalVisible(false);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setIsDarkMode(value);
    Appearance.setColorScheme(value ? 'dark' : 'light');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={[styles.container]}>
      {/* Top Navigation Bar */}
      <View className="bg-background border-b-separator" style={[styles.topBar]}>
        <TouchableOpacity style={styles.topBarButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Icon className='text-icon' as={ChevronLeft} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {t('title.settings')}
        </Text>
        <View style={styles.topBarButton} />
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View className='bg-card border border-cardBorder' style={[styles.card]}>
          {/* Language Row */}
          <TouchableOpacity
            style={styles.cardRow}
            activeOpacity={0.7}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.cardRowLeft}>
              <Icon className='text-primary' as={Globe} size={20} />
              <Text className='text-label' style={[styles.cardRowLabel]}>
                {t('title.language')}
              </Text>
            </View>
            <View style={styles.cardRowRight}>
              <Text className='text-value' style={[styles.cardRowValue]}>
                {t(currentLanguage.labelKey)}
              </Text>
              <Icon className='text-muted' as={ChevronRight} size={16} />
            </View>
          </TouchableOpacity>

          <View className='bg-separator' style={[styles.separator]} />

          {/* Dark Mode Row */}
          <View style={styles.cardRow}>
            <View style={styles.cardRowLeft}>
              <Icon className='text-primary' as={Moon} size={20} />
              <Text className='text-label' style={[styles.cardRowLabel]}>
                {t('title.darkMode')}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: "grey", true: "green" }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          className='bg-popover'
          style={[styles.modalOverlay]}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View className='bg-card' style={[styles.modalContent]}>
            <View style={styles.modalHandle} />
            <Text className='text-foreground' style={[styles.modalTitle]}>
              {t('title.selectLanguage')}
            </Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                  activeOpacity={0.7}
                >
                  <Text className='text-foreground' style={[styles.languageLabel]}>
                    {t(item.labelKey)}
                  </Text>
                  {item.code === i18n.language && (
                    <Icon className='text-foreground' as={ChevronRight} size={16} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View className='bg-separator' style={[styles.separator]} />
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  topBarButton: {
    padding: 4,
    width: 32,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardRowValue: {
    fontSize: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    maxHeight: '50%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9BA1A6',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  languageLabel: {
    fontSize: 15,
  },
});

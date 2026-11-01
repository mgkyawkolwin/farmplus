'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck, ChevronLeft, Mail } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { THEME } from '@/lib/theme';
import { CustomerMessage } from '@/models/message';
import { MessageServiceClient } from '@/services/messageService';

const messageService = new MessageServiceClient();
const PAGE_SIZE = 20;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function getPreview(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 50);
}

export default function MessagesListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const [messages, setMessages] = React.useState<CustomerMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadMessages = React.useCallback(async (nextPage = 1, append = false) => {
    try {
      const result = await messageService.getMessages(nextPage, PAGE_SIZE);
      setMessages((current) => append ? [...current, ...result] : result);
      setPage(nextPage);
      setHasMore(result.length === PAGE_SIZE);
    } catch (error) {
      if (!append) setMessages([]);
      SnackBar.Error(error instanceof Error ? error.message : t('messages.errorLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadMessages();
      return undefined;
    }, [loadMessages]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadMessages(page + 1, true);
  };

  const markRead = async (message: CustomerMessage) => {
    if (message.isRead) return;
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, isRead: true } : item));
    try {
      await messageService.markRead(message.id);
    } catch (error) {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, isRead: false } : item));
      SnackBar.Error(error instanceof Error ? error.message : t('messages.errorMarkRead'));
    }
  };

  const openMessage = async (message: CustomerMessage) => {
    await markRead(message);
    router.push(`/messages/${encodeURIComponent(message.id)}` as Parameters<typeof router.push>[0]);
  };

  const unreadCount = messages.filter((message) => !message.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && messages.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('messages.headerList')}</Text>
        <View style={styles.headerMeta}>
          <Icon className="text-muted-foreground" as={CheckCheck} size={16} />
          <Text className="text-muted-foreground" style={styles.unreadCount}>{unreadCount}</Text>
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('messages.loadingList')}</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centeredState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.secondary }]}>
            <Bell size={22} color={theme.primary} />
          </View>
          <Text className="text-foreground" style={styles.stateTitle}>{t('messages.emptyListTitle')}</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>{t('messages.emptyListBody')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              void loadMessages();
            }} />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) loadMore();
          }}
        >
          {messages.map((message) => (
            <Pressable
              key={message.id}
              accessibilityRole="button"
              accessibilityLabel={t('messages.accessibilityLabel', {
                title: message.title || t(message.audience === 'Broadcast' ? 'messages.announcement' : 'messages.messageUntitled'),
                status: t(message.isRead ? 'messages.read' : 'messages.unread'),
                date: formatDate(message.sentAtUtc),
              })}
              onPress={() => void openMessage(message)}
              style={[
                styles.messageRow,
                { backgroundColor: theme.card, borderColor: message.isRead ? theme.border : theme.primary },
              ]}
            >
              <View style={[styles.messageIcon, { backgroundColor: theme.secondary }]}>
                <Mail size={17} color={message.isRead ? theme.mutedForeground : theme.primary} />
              </View>
              <View style={styles.messageBody}>
                <View style={styles.messageHeader}>
                  <Text className="text-foreground" style={styles.messageTitle} numberOfLines={1}>
                    {message.title || t(message.audience === 'Broadcast' ? 'messages.announcement' : 'messages.messageUntitled')}
                  </Text>
                  <Text className="text-muted-foreground" style={styles.date}>{formatDate(message.sentAtUtc)}</Text>
                </View>
                <Text className="text-muted-foreground" style={styles.messageText} numberOfLines={1} ellipsizeMode="tail">
                  {getPreview(message.messageText)}
                </Text>
                <View style={styles.messageFooter}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: message.isRead ? theme.mutedForeground : theme.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: message.isRead ? theme.mutedForeground : theme.primary },
                    ]}
                  >
                    {t(message.isRead ? 'messages.read' : 'messages.unread')}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color={theme.primary} /> : null}
          {!hasMore ? <Text style={[styles.endNote, { color: theme.mutedForeground }]}>{t('messages.endOfList')}</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  headerMeta: { minWidth: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  unreadCount: { fontSize: 12, fontWeight: '700' },
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderRadius: 7 },
  messageIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  messageBody: { flex: 1, gap: 8 },
  messageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  messageTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  date: { fontSize: 10, textAlign: 'right', flexShrink: 0 },
  messageText: { fontSize: 13, lineHeight: 19 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  stateTitle: { marginTop: 12, fontSize: 17, fontWeight: '700' },
  stateText: { marginTop: 7, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
  endNote: { textAlign: 'center', fontSize: 11, paddingVertical: 8 },
});
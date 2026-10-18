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
import { Bell, CheckCheck, ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
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

export default function MessagesListScreen() {
  const router = useRouter();
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
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to load messages');
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
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to mark message as read');
    }
  };

  const unreadCount = messages.filter((message) => !message.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && messages.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerMeta}>
          <Icon className="text-muted-foreground" as={CheckCheck} size={16} />
          <Text className="text-muted-foreground" style={styles.unreadCount}>{unreadCount}</Text>
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centeredState}>
          <View style={styles.emptyIcon}><Bell size={22} color="#2367A8" /></View>
          <Text className="text-foreground" style={styles.stateTitle}>You’re all caught up</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>New messages will appear here.</Text>
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
              accessibilityLabel={`${message.isRead ? 'Read' : 'Unread'} message, ${formatDate(message.sentAtUtc)}`}
              onPress={() => void markRead(message)}
              style={[styles.messageRow, !message.isRead && styles.unreadMessage]}
            >
              <View style={[styles.messageIcon, !message.isRead && styles.messageIconUnread]}>
                <Bell size={17} color={!message.isRead ? '#2367A8' : '#64748B'} />
              </View>
              <View style={styles.messageBody}>
                <View style={styles.messageHeader}>
                  <Text className="text-foreground" style={styles.messageLabel}>
                    {message.audience === 'Broadcast' ? 'Announcement' : 'Message'}
                  </Text>
                  <Text className="text-muted-foreground" style={styles.date}>{formatDate(message.sentAtUtc)}</Text>
                </View>
                <Text className="text-foreground" style={styles.messageText}>{message.messageText}</Text>
                <View style={styles.messageFooter}>
                  <View style={[styles.statusDot, message.isRead ? styles.readDot : styles.unreadDot]} />
                  <Text style={[styles.statusLabel, message.isRead ? styles.readLabel : styles.unreadLabel]}>
                    {message.isRead ? 'Read' : 'Unread · tap to mark read'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#16794B" /> : null}
          {!hasMore ? <Text style={styles.endNote}>End of messages</Text> : null}
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
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 7, backgroundColor: '#FFFFFF' },
  unreadMessage: { borderColor: '#BFD7EC', backgroundColor: '#F7FBFF' },
  messageIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#F1F5F9' },
  messageIconUnread: { backgroundColor: '#EAF3FB' },
  messageBody: { flex: 1, gap: 8 },
  messageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  messageLabel: { flex: 1, fontSize: 13, fontWeight: '800' },
  date: { fontSize: 10, textAlign: 'right' },
  messageText: { fontSize: 13, lineHeight: 19 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  unreadDot: { backgroundColor: '#2367A8' },
  readDot: { backgroundColor: '#94A3B8' },
  statusLabel: { fontSize: 10, fontWeight: '600' },
  unreadLabel: { color: '#2367A8' },
  readLabel: { color: '#64748B' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#EAF3FB' },
  stateTitle: { marginTop: 12, fontSize: 17, fontWeight: '700' },
  stateText: { marginTop: 7, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
  endNote: { textAlign: 'center', color: '#64748B', fontSize: 11, paddingVertical: 8 },
});
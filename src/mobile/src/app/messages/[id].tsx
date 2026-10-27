'use client';

import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import SnackBar from '@/components/ui/snack-bar';
import { Text } from '@/components/ui/text';
import { CustomerMessage } from '@/models/message';
import { MessageServiceClient } from '@/services/messageService';

const messageService = new MessageServiceClient();

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

export default function MessageDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const messageId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [message, setMessage] = React.useState<CustomerMessage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [isMarkingUnread, setIsMarkingUnread] = React.useState(false);

  React.useEffect(() => {
    if (!messageId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }

    let active = true;
    messageService.getMessage(messageId)
      .then((result) => {
        if (active) setMessage(result);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [messageId]);

  const markUnread = async () => {
    if (!message || !message.isRead || isMarkingUnread) return;
    setIsMarkingUnread(true);
    try {
      await messageService.markUnread(message.id);
      setMessage({ ...message, isRead: false, readAtUtc: undefined });
      SnackBar.Success('Message marked as unread');
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to mark message as unread');
    } finally {
      setIsMarkingUnread(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Message</Text>
        {message ? (
          <Button
            variant="ghost"
            style={styles.markUnreadHeaderButton}
            onPress={() => void markUnread()}
            disabled={!message.isRead || isMarkingUnread}
            accessibilityLabel={message.isRead ? 'Mark message as unread' : 'Message is unread'}
          >
            <Text className="text-foreground" style={styles.markUnreadButtonText}>
              {isMarkingUnread ? 'Marking...' : message.isRead ? 'Mark unread' : 'Unread'}
            </Text>
          </Button>
        ) : <View style={styles.headerSpacer} />}
      </View>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading message...</Text>
        </View>
      ) : !message || loadFailed ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>Message unavailable</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>This message could not be loaded.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text className="text-foreground" style={styles.title}>{message.title}</Text>
          <View style={styles.metadata}>
            <Text className="text-muted-foreground" style={styles.date}>{formatDate(message.sentAtUtc)}</Text>
            <View style={styles.readStatus}>
              <View style={[styles.statusDot, message.isRead ? styles.readDot : styles.unreadDot]} />
              <Text style={[styles.statusText, message.isRead ? styles.readText : styles.unreadText]}>
                {message.isRead ? 'Read' : 'Unread'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text className="text-foreground" style={styles.messageText}>{message.messageText}</Text>
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
  headerSpacer: { width: 44 },
  markUnreadHeaderButton: { minWidth: 88, paddingHorizontal: 4 },
  markUnreadButtonText: { fontSize: 12, fontWeight: '600' },
  content: { flexGrow: 1, padding: 20, paddingBottom: 32 },
  title: { marginTop: 12, fontSize: 22, fontWeight: '700' },
  metadata: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12 },
  date: { flex: 1, fontSize: 12 },
  readStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  readDot: { backgroundColor: '#94A3B8' },
  unreadDot: { backgroundColor: '#2367A8' },
  statusText: { fontSize: 11, fontWeight: '600' },
  readText: { color: '#64748B' },
  unreadText: { color: '#2367A8' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#CBD5E1', marginVertical: 18 },
  messageText: { fontSize: 15, lineHeight: 24 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
});
"use client";

import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bot, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { fetchApi } from '@/lib/apiClient';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export default function ChatScreen() {
  const router = useRouter();
  const [messageText, setMessageText] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'bot-1',
      text: 'Hello! Ask me anything about FarmPlus and I will reply here.',
      sender: 'bot',
    },
  ]);
  const [sending, setSending] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const scrollToBottom = React.useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmedText = messageText.trim();
    if (!trimmedText) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: trimmedText,
      sender: 'user',
    };

    setMessages((current) => [...current, userMessage]);
    setMessageText('');
    setSending(true);
    setTyping(true);

    try {
      const response = await fetchApi('/chat', {
        method: 'POST',
        body: JSON.stringify(trimmedText),
      });

      const botText = response.data ?? 'No response received.';
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: typeof botText === 'string' ? botText : JSON.stringify(botText),
        sender: 'bot',
      };

      setMessages((current) => [...current, botMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send message.';
      Alert.alert('Chat Error', message);
      setMessages((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          text: 'Sorry, I could not send your message. Please try again.',
          sender: 'bot',
        },
      ]);
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>
        <View style={styles.topBarTitleContainer}>
          <View style={styles.botIconContainer}>
            <Bot size={24} color="#2563EB" />
          </View>
          <Text style={styles.topBarTitle}>
            AI Chat
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0, default: 0 })}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <View key={message.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
                {!isUser && (
                  <Avatar alt="Bot" style={styles.avatar}>
                    <AvatarFallback>
                      <Text className="text-foreground">B</Text>
                    </AvatarFallback>
                  </Avatar>
                )}

                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                    {message.text}
                  </Text>
                </View>

                {isUser && (
                  <Avatar alt="User" style={styles.avatar}>
                    <AvatarFallback>
                      <Text className="text-foreground">U</Text>
                    </AvatarFallback>
                  </Avatar>
                )}
              </View>
            );
          })}
          {typing && (
            <View style={[styles.messageRow, styles.messageRowBot]}>
              <Avatar alt="Bot" style={styles.avatar}>
                <AvatarFallback>
                  <Text className="text-foreground">B</Text>
                </AvatarFallback>
              </Avatar>
              <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                <Text style={[styles.messageText, styles.botText]}>AI is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <Input
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type your message..."
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!sending}
            style={styles.input}
          />
          <Button onPress={handleSend} disabled={sending} style={styles.sendButton}>
            <Send size={18} color="#ffffff" />
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  topBarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    opacity: 0.85,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#0F172A',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

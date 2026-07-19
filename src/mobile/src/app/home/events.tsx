'use client';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function EventsPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Events (placeholder)</Text>
    </View>
  );
}

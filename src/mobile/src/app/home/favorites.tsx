'use client';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function FavoritesPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Favorites (placeholder)</Text>
    </View>
  );
}

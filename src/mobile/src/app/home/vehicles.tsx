'use client';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function VehiclesPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Vehicles (placeholder)</Text>
    </View>
  );
}

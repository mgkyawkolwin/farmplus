import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

type LoadingOverlayProps = {
  isLoading: boolean;
};

export default function LoadingOverlay({ isLoading }: LoadingOverlayProps) {

  if (!isLoading) {
    return null;
  }

  return (
    <Modal transparent visible={isLoading} animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}> 
          <ActivityIndicator size="large" color="#000" />
          <Text style={[styles.text, { color: '#000' }]}>Processing ...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    minWidth: 180,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  text: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
});

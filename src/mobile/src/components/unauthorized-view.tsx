import { ShieldX } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function UnauthorizedView({
  message = 'You do not have permission to view this page.',
}: {
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <ShieldX size={28} color="#B42318" />
      </View>
      <Text style={styles.title}>Not authorized</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#FFF1F0',
    marginBottom: 16,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});

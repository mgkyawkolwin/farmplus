'use client';

import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PhoneScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

    return (
        <View className="flex-1 bg-background" style={styles.page}>
            <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-background border-border" style={[styles.headerBar]}>
                <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
                    <Icon className="text-foreground" as={ChevronLeft} size={22} />
                    <Text className="text-foreground" style={styles.backButtonText}>
                        Back
                    </Text>
                </Button>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="h2" style={styles.header}>
                    Verify OTP
                </Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to 09-xxxxxxxxx.
                </Text>

                <View style={styles.field}>
                    <Label>OTP Code</Label>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Input placeholder="XXXXXX" />
                    </View>
                </View>

                <Button style={styles.continueButton} onPress={() => router.push('./plan')}>
                    <Text>Verify OTP</Text>
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    titleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    backButton: {
        minWidth: 80,
    },
    titleBarTitle: {
        textAlign: 'center',
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 32,
        gap: 20,
    },
    header: {
        marginBottom: 8,
        textAlign: 'left',
    },
    subtitle: {
        marginBottom: 24,
        color: '#6B7280',
        fontSize: 16,
        lineHeight: 24,
    },
    field: {
        gap: 8,
    },
    continueButton: {
        marginTop: 20,
        width: '100%',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 22,
    },
    backButtonText: {
        marginLeft: 4,
        fontSize: 18,
        fontWeight: '500',
    },
});

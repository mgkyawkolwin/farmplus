'use client';

import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ChevronLeft, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@rn-primitives/context-menu';

export default function ConfirmScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();

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
                    Plan Summary
                </Text>
                <Text style={styles.subtitle}>
                    Start with a plan that suits your business.
                </Text>
                <Card>
                    <CardContent>
                        <View className="flex flex-row items-center gap-3">
                            <Icon className="text-foreground" as={Crown} size={48} />
                            <Label htmlFor="freemium" className="text-text text-lg font-bold">Freemium</Label>
                        </View>
                        <View>
                            <Text className="text-text-muted text-lg">License</Text>
                            <Text className="text-text text-lg font-bold">1 Year</Text>
                            <Separator className="bg-text-muted h-1 my-2" />
                            <Text className="text-text-muted text-lg">Price</Text>
                            <Text className="text-text text-lg font-bold">XXX,XXX,XXX</Text>
                        </View>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <View className="flex flex-row items-center gap-3">
                            <Label htmlFor="premium" className="text-text text-lg">Includes</Label>
                        </View>
                        <View className="flex flex-col gap-2">
                            <Text className="text-text-muted text-sm">✔ Unlimited Shops</Text>
                            <Text className="text-text-muted text-sm">✔ Unlimited Users</Text>
                            <Text className="text-text-muted text-sm">✔ Full Features</Text>
                            <Text className="text-text-muted text-sm">✔ Unlimited Transactions</Text>
                        </View>
                    </CardContent>
                </Card>

                <Button style={styles.continueButton} onPress={() => router.push('./shop')}>
                    <Text>Confirm Plan</Text>
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

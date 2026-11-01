'use client';

import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { useColorScheme } from 'nativewind';
import { ChevronLeft, Crown, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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

export default function DoneScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

    return (
        <View className="flex-1 bg-background" style={styles.page}>
            <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-background border-border" style={[styles.headerBar]}>
                
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Icon className="text-foreground" as={CheckCircle} size={72} />
                <Text variant="h2" style={styles.header}>
                    {t('accounts.done.congratulations')}
                </Text>
                <Text style={styles.subtitle}>
                    {t('accounts.done.readySubtitle')}
                </Text>
                <Card className="w-[70%]">
                    <CardContent>
                        <View>
                            <Text className="text-text-muted text-lg">{t('accounts.shopName')}</Text>
                            <Text className="text-text text-lg font-bold">ABC Agri Store</Text>
                            <Separator className="bg-text-muted h-1 my-2" />
                            <Text className="text-text-muted text-lg">{t('accounts.planLabel')}</Text>
                            <Text className="text-text text-lg font-bold">{t('accounts.plans.premium')}</Text>
                            <Separator className="bg-text-muted h-1 my-2" />
                            <Text className="text-text-muted text-lg">{t('accounts.license')}</Text>
                            <Text className="text-text text-lg font-bold">{t('accounts.oneYearDays')}</Text>
                            <Separator className="bg-text-muted h-1 my-2" />
                            <Text className="text-text-muted text-lg">{t('accounts.done.validUntil')}</Text>
                            <Text className="text-text text-lg font-bold">08 May 2027</Text>
                        </View>
                    </CardContent>
                </Card>

                <Button style={styles.continueButton} onPress={() => router.push('../home/dashboard')}>
                    <Text>{t('accounts.done.goToDashboard')}</Text>
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
        alignItems: 'center',
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

'use client';

import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { useColorScheme } from 'nativewind';
import { ChevronLeft, Crown } from 'lucide-react-native';
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

export default function ConfirmScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

    return (
        <View className="flex-1 bg-background" style={styles.page}>
            <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-background border-border" style={[styles.headerBar]}>
                <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
                    <Icon className="text-foreground" as={ChevronLeft} size={22} />
                    <Text className="text-foreground" style={styles.backButtonText}>
                        {t('accounts.back')}
                    </Text>
                </Button>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="h2" style={styles.header}>
                    {t('accounts.confirm.title')}
                </Text>
                <Text style={styles.subtitle}>
                    {t('accounts.planSubtitle')}
                </Text>
                <Card>
                    <CardContent>
                        <View className="flex flex-row items-center gap-3">
                            <Icon className="text-foreground" as={Crown} size={48} />
                            <Label htmlFor="freemium" className="text-text text-lg font-bold">{t('accounts.plans.freemium')}</Label>
                        </View>
                        <View>
                            <Text className="text-text-muted text-lg">{t('accounts.license')}</Text>
                            <Text className="text-text text-lg font-bold">{t('accounts.oneYear')}</Text>
                            <Separator className="bg-text-muted h-1 my-2" />
                            <Text className="text-text-muted text-lg">{t('accounts.price')}</Text>
                            <Text className="text-text text-lg font-bold">XXX,XXX,XXX</Text>
                        </View>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <View className="flex flex-row items-center gap-3">
                            <Label htmlFor="premium" className="text-text text-lg">{t('accounts.includes')}</Label>
                        </View>
                        <View className="flex flex-col gap-2">
                            <Text className="text-text-muted text-sm">✔ {t('accounts.features.unlimitedShops')}</Text>
                            <Text className="text-text-muted text-sm">✔ {t('accounts.features.unlimitedUsers')}</Text>
                            <Text className="text-text-muted text-sm">✔ {t('accounts.features.fullFeatures')}</Text>
                            <Text className="text-text-muted text-sm">✔ {t('accounts.features.unlimitedTransactions')}</Text>
                        </View>
                    </CardContent>
                </Card>

                <Button style={styles.continueButton} onPress={() => router.push('./shop')}>
                    <Text>{t('accounts.confirm.confirmPlan')}</Text>
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

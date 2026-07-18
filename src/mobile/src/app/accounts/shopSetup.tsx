'use client';

import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ChevronLeft, Check, CheckCircle, CheckCircle2, CheckCircle2Icon, Circle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useEffect } from 'react';

export default function ShopSetupScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('./done');
        }, 4000); // 3 seconds delay

        return () => clearTimeout(timer); // Cleanup the timer on unmount
    }, []);

    return (
        <View className="flex-1 bg-background" style={styles.page}>
            <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-background border-border" style={[styles.headerBar]}>
                
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="h2" style={styles.header}>
                    Creating Your Shop
                </Text>
                <Text style={styles.subtitle}>
                    Please wait while we setup your shop and configure everything.
                </Text>

                <View style={{ flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                    <View style={styles.field}>
                        <Icon className="text-foreground" as={CheckCircle} size={22} />
                        <Text style={styles.subtitle}>
                            Creating User Profile
                        </Text>
                    </View>
                    <View style={styles.field}>
                        <Icon className="text-foreground" as={CheckCircle} size={22} />
                        <Text style={styles.subtitle}>
                            Creating Shop Profile
                        </Text>
                    </View>
                    <View style={styles.field}>
                        <Icon className="text-foreground" as={CheckCircle} size={22} />
                        <Text style={styles.subtitle}>
                            Activating Subscription Plan
                        </Text>
                    </View>
                    <View style={styles.field}>
                        <Icon className="text-foreground" as={CheckCircle} size={22} />
                        <Text style={styles.subtitle}>
                            Setting Default Prefernces
                        </Text>
                    </View>
                    <View style={styles.field}>
                        <Icon className="text-foreground" as={CheckCircle} size={22} />
                        <Text style={styles.subtitle}>
                            Setting Default Categories
                        </Text>
                    </View>
                    <View style={styles.field}>
                        <Icon className="text-foreground" as={Circle} size={22} />
                        <Text style={styles.subtitle}>
                            Setting Permissions
                        </Text>
                    </View>
                </View>
                <View style={styles.field}>
                    <Progress value={80} className="w-[80%]" />
                    <Text >
                        80%
                    </Text>
                </View>

                
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
        verticalAlign: 'middle',
    },
    field: {
        flexDirection: 'row',
        gap: 8,
        verticalAlign: 'middle',
        alignContent: 'center',
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

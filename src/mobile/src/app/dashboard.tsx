'use client';

import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ArrowLeft, BarChart2, Box, Bell, Building, Calendar, ChevronLeft, DamIcon, DollarSign, File, HandCoins, LayoutDashboard, Menu, MoreHorizontal, TrendingUp } from 'lucide-react-native';
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

export default function DashboardScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [activeTab, setActiveTab] = React.useState<'dashboard' | 'sales' | 'products' | 'reports' | 'more'>('dashboard');

    const tabItems = [
        { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { key: 'sales' as const, label: 'Sales', icon: TrendingUp },
        { key: 'products' as const, label: 'Products', icon: Box },
        { key: 'reports' as const, label: 'Reports', icon: BarChart2 },
        { key: 'more' as const, label: 'More', icon: MoreHorizontal },
    ];

    return (
        <View className="flex-1 bg-background" style={styles.page}>
            <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-background border-border" style={[styles.headerBar]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
                            <Icon className="text-foreground" as={Menu} size={22} />
                        </Button>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="ABC Agri Store" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key="township1" label="Township 1" value="township1" />
                            </SelectContent>
                        </Select>
                    </View>
                    <Icon className="text-foreground" as={Bell} size={22} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'dashboard' ? (
                    <>
                        <Text variant="h2" style={styles.header}>
                            Good Morning, User!
                        </Text>
                        <Text style={styles.subtitle}>
                            Here's your dashboard overview.
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <Card style={{ flex: 1 }}>
                                <CardContent>
                                    <View>
                                        <Text className="text-text-muted text-sm">Today's Sales</Text>
                                        <Text className="text-text-muted text-lg font-bold">0 MMK</Text>
                                    </View>
                                </CardContent>
                            </Card>
                            <Card style={{ flex: 1 }}>
                                <CardContent>
                                    <View>
                                        <Text className="text-text-muted text-sm">Today's Purchases</Text>
                                        <Text className="text-text-muted text-lg font-bold">0 MMK</Text>
                                    </View>
                                </CardContent>
                            </Card>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                            <Card style={{ flex: 1 }}>
                                <CardContent>
                                    <View>
                                        <Text className="text-text-muted text-sm">Total Products</Text>
                                        <Text className="text-text-muted text-lg font-bold">0</Text>
                                    </View>
                                </CardContent>
                            </Card>
                            <Card style={{ flex: 1 }}>
                                <CardContent>
                                    <View>
                                        <Text className="text-text-muted text-sm">Total Customers</Text>
                                        <Text className="text-text-muted text-lg font-bold">0</Text>
                                    </View>
                                </CardContent>
                            </Card>
                        </View>

                        <Text className="text-text text-xl font-bold">Quick Actions</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <CardContent>
                                    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <Icon className="text-foreground" as={DollarSign} size={48} />
                                        <Text className="text-text-muted text-sm">New Sales</Text>
                                    </View>
                                </CardContent>
                            </Card>
                            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <CardContent>
                                    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <Icon className="text-foreground" as={HandCoins} size={48} />
                                        <Text className="text-text-muted text-sm">New Products</Text>
                                    </View>
                                </CardContent>
                            </Card>
                            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <CardContent>
                                    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <Icon className="text-foreground" as={File} size={48} />
                                        <Text className="text-text-muted text-sm">New Purchases</Text>
                                    </View>
                                </CardContent>
                            </Card>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <CardContent>
                                    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <Icon className="text-foreground" as={Calendar} size={48} />
                                        <Text className="text-text-muted text-sm">New Sales</Text>
                                    </View>
                                </CardContent>
                            </Card>
                            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <CardContent>
                                    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <Icon className="text-foreground" as={Building} size={48} />
                                        <Text className="text-text-muted text-sm">New Products</Text>
                                    </View>
                                </CardContent>
                            </Card>
                            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <CardContent>
                                    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <Icon className="text-foreground" as={DamIcon} size={48} />
                                        <Text className="text-text-muted text-sm">New Purchases</Text>
                                    </View>
                                </CardContent>
                            </Card>
                        </View>
                    </>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Icon className="text-foreground" as={tabItems.find((item) => item.key === activeTab)?.icon ?? BarChart2} size={48} />
                        <Text variant="h2" style={styles.header}>
                            {tabItems.find((item) => item.key === activeTab)?.label}
                        </Text>
                        <Text style={styles.subtitle}>
                            This section is coming soon.
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.tabBar}>
                {tabItems.map((tab) => {
                    const IconComponent = tab.icon;
                    const selected = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabItem, selected && styles.tabItemActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Icon className={selected ? 'text-primary' : 'text-text-muted'} as={IconComponent} size={20} />
                            <Text className={selected ? 'text-primary' : 'text-text-muted'} style={styles.tabLabel}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
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
        minWidth: 40,
    },
    titleBarTitle: {
        textAlign: 'center',
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 96,
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
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    tabBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabItemActive: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
    },
    tabLabel: {
        marginTop: 4,
        fontSize: 12,
    },
    backButtonText: {
        marginLeft: 4,
        fontSize: 18,
        fontWeight: '500',
    },
});

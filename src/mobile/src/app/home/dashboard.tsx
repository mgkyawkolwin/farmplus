// Copied dashboard screen into home folder as requested
'use client';

import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, BarChart2, Box, Bell, Building, Calendar, DamIcon, DollarSign, File, HandCoins, LayoutDashboard, Menu, MoreHorizontal, TrendingUp } from 'lucide-react-native';
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
import HomeTopBar from '@/components/homeTopBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingOverlay from '@/components/loadingOverlay';

export default function DashboardScreen() {

    return (
        <SafeAreaView className="bg-background" style={styles.page}>
            <HomeTopBar />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text variant="h2" style={styles.header}>
                    Good Morning, User!
                </Text>
                <Text style={styles.subtitle}>
                    Here's your dashboard overview.
                </Text>
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Card style={{ flex: 1}}>
                        <CardContent>
                            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Icon className="text-foreground" as={DollarSign} size={48} />
                                <Text className="text-text-muted text-sm">New Sales</Text>
                            </View>
                        </CardContent>
                    </Card>
                    <Card style={{ flex: 1}}>
                        <CardContent>
                            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Icon className="text-foreground" as={HandCoins} size={48} />
                                <Text className="text-text-muted text-sm">New Products</Text>
                            </View>
                        </CardContent>
                    </Card>
                    <Card style={{ flex: 1 }}>
                        <CardContent>
                            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Icon className="text-foreground" as={File} size={48} />
                                <Text className="text-text-muted text-sm">New Purchases</Text>
                            </View>
                        </CardContent>
                    </Card>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Card style={{ flex: 1 }}>
                        <CardContent>
                            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Icon className="text-foreground" as={Calendar} size={48} />
                                <Text className="text-text-muted text-sm word-break">New Sales</Text>
                            </View>
                        </CardContent>
                    </Card>
                    <Card style={{ flex: 1 }}>
                        <CardContent>
                            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Icon className="text-foreground" as={Building} size={48} />
                                <Text className="text-text-muted text-sm word-break">New Products</Text>
                            </View>
                        </CardContent>
                    </Card>
                    <Card style={{ flex: 1 }}>
                        <CardContent>
                            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <Icon className="text-foreground" as={DamIcon} size={48} />
                                <Text className="text-text-muted text-sm word-break">New Purchases</Text>
                            </View>
                        </CardContent>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
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

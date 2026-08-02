'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Modal, Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Pencil, Trash2, X, UserPlus, Users, CreditCard, Gift, Phone, BarChart3, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import HomeTopBar from '@/components/homeTopBar';
import { CategoryServiceClient } from '@/services/categoryService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { CategoryItem } from '@/models/category';

const SAMPLE_CUSTOMERS = [
    { id: 1, name: 'Aung Zaw', phone: '+95 9123 456 789', lastPurchase: '2026-08-01', balance: '125,000' },
    { id: 2, name: 'Ma Lun', phone: '+95 9234 567 890', lastPurchase: '2026-07-30', balance: '89,500' },
    { id: 3, name: 'Ko Min', phone: '+95 9345 678 901', lastPurchase: '2026-07-28', balance: '250,000' },
    { id: 4, name: 'Kyar Lay', phone: '+95 9456 789 012', lastPurchase: '2026-07-25', balance: '45,200' },
    { id: 5, name: 'Sein Thu', phone: '+95 9567 890 123', lastPurchase: '2026-07-22', balance: '180,750' },
    { id: 6, name: 'Thu Ya', phone: '+95 9678 901 234', lastPurchase: '2026-07-20', balance: '65,300' },
    { id: 7, name: 'Win Htut', phone: '+95 9789 012 345', lastPurchase: '2026-07-18', balance: '320,000' },
    { id: 8, name: 'Soe Moe', phone: '+95 9890 123 456', lastPurchase: '2026-07-15', balance: '92,600' },
    { id: 9, name: 'Tun Lin', phone: '+95 9901 234 567', lastPurchase: '2026-07-12', balance: '156,400' },
    { id: 10, name: 'Hay Man', phone: '+95 9012 345 678', lastPurchase: '2026-07-10', balance: '78,900' },
];

export default function CustomerTabScreen() {
    const router = useRouter();
    const [selectedPeriod, setSelectedPeriod] = React.useState('this-month');

    const metrics = [
        { label: 'Total Customers', value: '2,500' },
        { label: 'New Customers', value: '25' },
        { label: 'Members', value: '1,980' },
        { label: 'Active Customers', value: '2,350' },
        { label: 'Receivable', value: '5,800,000' },
        { label: 'Outstanding', value: '1,200,000' },
    ];

    return (
        <SafeAreaView className='bg-background' style={styles.page}>
            <HomeTopBar />
            <KeyboardAwareScrollView className='bg-background' style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text variant="h3" className='text-foreground'>Overview</Text>
                </View>

                {/* Period Dropdown */}
                <View style={styles.dropdownContainer}>
                    <Select value={selectedPeriod as any} onValueChange={option => setSelectedPeriod}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder='Today' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today" label="Today" />
                            <SelectItem value="this-week" label="This Week" />
                            <SelectItem value="this-month" label="This Month" />
                            <SelectItem value="this-year" label="This Year" />
                        </SelectContent>
                    </Select>
                </View>

                {/* Metrics Grid - 2 columns */}
                <View style={styles.metricsGrid}>
                    {metrics.map((metric, index) => (
                        <Card key={index} style={styles.metricCard}>
                            <Text className='text-muted-foreground text-sm' style={styles.metricLabel}>
                                {metric.label}
                            </Text>
                            <Text variant="h4" className='text-foreground' style={styles.metricValue}>
                                {metric.value}
                            </Text>
                        </Card>
                    ))}
                </View>

                {/* Quick Actions Section */}
                <View style={styles.quickActionsContainer}>
                    <Text variant="h3" className='text-foreground' style={styles.quickActionsTitle}>Quick Actions</Text>
                    
                    <View style={styles.quickActionsGrid}>
                        {/* New Customer */}
                        <Pressable style={styles.actionButton} onPress={() => router.push('/customers/new')}>
                            <UserPlus size={32} className='text-foreground' />
                            <Text className='text-foreground text-xs' style={styles.actionLabel}>New Customer</Text>
                        </Pressable>
                        
                        {/* Members */}
                        <Pressable style={styles.actionButton} onPress={() => router.push('/customers/list')}>
                            <Users size={32} className='text-foreground' />
                            <Text className='text-foreground text-xs' style={styles.actionLabel}>Customers</Text>
                        </Pressable>
                        
                        {/* Receivable */}
                        <Pressable style={styles.actionButton}>
                            <CreditCard size={32} className='text-foreground' />
                            <Text className='text-foreground text-xs' style={styles.actionLabel}>Receivable</Text>
                        </Pressable>
                        
                        {/* Loyalty Points */}
                        <Pressable style={styles.actionButton}>
                            <Gift size={32} className='text-foreground' />
                            <Text className='text-foreground text-xs' style={styles.actionLabel}>Loyalty Points</Text>
                        </Pressable>
                        
                        {/* Contacts */}
                        <Pressable style={styles.actionButton}>
                            <Phone size={32} className='text-foreground' />
                            <Text className='text-foreground text-xs' style={styles.actionLabel}>Contacts</Text>
                        </Pressable>
                        
                        {/* Customer Report */}
                        <Pressable style={styles.actionButton}>
                            <BarChart3 size={32} className='text-foreground' />
                            <Text className='text-foreground text-xs' style={styles.actionLabel}>Customer Report</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Recent Customers Section */}
                <View style={styles.recentCustomersContainer}>
                    <View style={styles.recentCustomersHeader}>
                        <Text variant="h3" className='text-foreground'>Recent Customers</Text>
                        <Pressable style={styles.viewAllButton}>
                            <Text className='text-primary text-sm' style={styles.viewAllText}>View All</Text>
                            <ChevronRight size={16} className='text-primary' />
                        </Pressable>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]} className='text-muted-foreground text-xs font-semibold'>Contact Info</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]} className='text-muted-foreground text-xs font-semibold'>Last Purchase</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]} className='text-muted-foreground text-xs font-semibold text-right'>Balance</Text>
                    </View>

                    {/* Table Rows */}
                    {SAMPLE_CUSTOMERS.map((customer) => (
                        <View key={customer.id} style={styles.tableRow}>
                            <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                                <Avatar alt="" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc' }}>
                                    <AvatarImage source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.id}` }} />
                                    <AvatarFallback>
                                        <Text>{customer.name.charAt(0)}</Text>
                                    </AvatarFallback>
                                </Avatar>
                                <View>
                                    <Text className='text-foreground text-sm font-medium'>{customer.name}</Text>
                                    <Text className='text-muted-foreground text-xs'>{customer.phone}</Text>
                                </View>
                            </View>
                            <View style={[styles.tableCell, { flex: 1.5 }]}>
                                <Text className='text-foreground text-sm'>{customer.lastPurchase}</Text>
                            </View>
                            <View style={[styles.tableCell, { flex: 1 }]}>
                                <Text className='text-foreground text-sm text-right font-medium'>{customer.balance}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </KeyboardAwareScrollView>

            
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
    },
    listContainer: {
        gap: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        padding: 8,
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    closeButton: {
        padding: 4,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        marginBottom: 8,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 12,
    },
    modalButton: {
        minWidth: 96,
    },
    dropdownContainer: {
        marginBottom: 20,
        marginTop: 8,
    },
    metricsGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        minWidth: '48%',
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    metricLabel: {
    },
    metricValue: {
        fontWeight: '600',
    },
    quickActionsContainer: {
        marginTop: 28,
    },
    quickActionsTitle: {
        marginBottom: 16,
    },
    quickActionsGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '30%',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
    },
    actionLabel: {
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    recentCustomersContainer: {
        marginTop: 28,
    },
    recentCustomersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    viewAllText: {
        marginRight: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 12,
        marginBottom: 12,
    },
    tableHeaderCell: {
        paddingHorizontal: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tableCell: {
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
});
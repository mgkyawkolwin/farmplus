"use client";

import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useColorScheme, useUnstableNativeVariable } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { LayoutDashboard, Box, TrendingUp, BarChart2, MoreHorizontal } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

export default function HomeTabsLayout() {
    const colorScheme = useColorScheme();
    const tabBackground = useUnstableNativeVariable('hsl(var(--tab))');
    const tabBarInactiveTintColor = useUnstableNativeVariable('hsl(var(--tab-foreground))');
    const tabBarActiveTintColor = useUnstableNativeVariable('hsl(50,50%,50%)');

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarStyle: { backgroundColor: '#ccc' },
                tabBarInactiveTintColor: 'hsl(0,0%,39%)',
                tabBarActiveTintColor: 'hsl(210,100%,50%)',
                headerShown: false,
                headerTitle: '',
                headerLeft: () => (
                    <View style={{ paddingLeft: 14 }}>
                        <Text variant="muted">FarmPlus</Text>
                    </View>
                ),
            })}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Icon as={LayoutDashboard} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="sales"
                options={{
                    title: 'Sales',
                    tabBarIcon: ({ color }) => <Icon as={LayoutDashboard} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color }) => <Icon as={Box} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color }) => <Icon as={TrendingUp} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="categories"
                options={{
                    title: 'Categories',
                    tabBarIcon: ({ color }) => <Icon as={TrendingUp} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color }) => <Icon as={BarChart2} color={color} size={20} />,
                }}
            />
        </Tabs>
    );
}

"use client";

import React from 'react';
import { router, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { LayoutDashboard, Box, TrendingUp, BarChart2, MoreHorizontal, Group, MessageCirclePlus, Bot } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

export default function HomeTabsLayout() {
    const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarStyle: { backgroundColor: '#fff' },
                tabBarInactiveTintColor: 'hsl(0,0%,39%)',
                tabBarActiveTintColor: 'hsl(210,100%,50%)',
                headerShown: false,
                headerTitle: '',
                tabBarLabelStyle: { fontSize: 12 },
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
                name="customerTab"
                options={{
                    title: 'Customer',
                    tabBarIcon: ({ color }) => <Icon as={Group} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="aichatplaceholder"
                listeners={{
                    tabPress: (e) => {
                        // Prevent default tab switching behavior
                        e.preventDefault();
                        // Push to your actual standalone screen route outside/above the tabs
                        router.push('/chat/chat'); 
                    },
                }}
                options={{
                    title: 'AI Chat',
                    tabBarIcon: ({ color }) => <Icon as={Bot} color={color} size={20} />,
                }}
            />
        </Tabs>
    );
}

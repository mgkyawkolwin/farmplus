"use client";

import React from 'react';
import { router, Tabs } from 'expo-router';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { LayoutDashboard, TrendingUp, WalletCards, Bot } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

export default function HomeTabsLayout() {
    return (
        <Tabs
            screenOptions={{
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
            }}
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
                    tabBarIcon: ({ color }) => <Icon as={TrendingUp} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="purchases"
                options={{
                    title: 'Purchases',
                    tabBarIcon: ({ color }) => <Icon as={WalletCards} color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="aichatplaceholder"
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
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

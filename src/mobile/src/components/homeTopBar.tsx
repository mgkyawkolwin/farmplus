'use client';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, View, useColorScheme, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from './ui/button';
import { Bell, Menu } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function FavoritesPlaceholder() {
    const router = useRouter();
    const colorScheme = useColorScheme();

    return (
        <View className='bg-tab' style={styles.container}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-red border-border" style={styles.headerBar}>
                <View style={styles.leftSection}>
                    <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
                        <Icon className="text-foreground" as={Menu} size={22} />
                    </Button>
                    <Select>
                        <SelectTrigger style={styles.selectTrigger}>
                            <SelectValue placeholder="ABC Agri Store" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key="township1" label="Township 1" value="township1" />
                        </SelectContent>
                    </Select>
                </View>
                <Icon className="text-foreground" as={Bell} size={22} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 52,
        maxHeight: 52,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        width: '100%',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    backButton: {
        minWidth: 40,
        padding: 0,
    },
    selectTrigger: {
        flex: 1,
        minWidth: 120,
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
});
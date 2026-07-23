// Copied dashboard screen into home folder as requested
'use client';

import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import HomeTopBar from '@/components/homeTopBar';

export default function ReportsScreen() {
    const router = useRouter();

    return (
        <View style={styles.page}>
            <HomeTopBar />
            <ScrollView className='bg-background' style={styles.scrollView}>
                <View className='bg-green' style={styles.content}>
                    <Text className='text-foreground' variant="h2" style={styles.header}>
                        Content here
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        textAlign: 'left',
    },
});
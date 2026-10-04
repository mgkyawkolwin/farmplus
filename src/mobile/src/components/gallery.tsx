'use client';

import * as React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export type GalleryProps = {
  images: string[];
  title?: string;
  columns?: number;
};

export default function Gallery({ images, title = 'Gallery', columns = 3 }: GalleryProps) {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const gridItemSize = (width - 48) / columns;

  const openImage = (index: number) => {
    router.push({
      pathname: '/products/gallery-view' as any,
      params: {
        images: JSON.stringify(images),
        index: String(index),
        mode: 'preview',
      },
    });
  };

  if (!images.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.grid}>
        {images.map((image, index) => (
          <Pressable
            key={`${image}-${index}`}
            onPress={() => openImage(index)}
            style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]}
          >
            <Image source={{ uri: image }} style={styles.gridImage} resizeMode="cover" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});

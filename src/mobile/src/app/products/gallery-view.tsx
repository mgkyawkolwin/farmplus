'use client';

import * as React from 'react';
import {
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ProductGalleryViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ images?: string | string[]; index?: string | string[]; mode?: string | string[] }>();
  const { width } = Dimensions.get('window');

  const parsedImages = React.useMemo(() => {
    const raw = Array.isArray(params.images) ? params.images[0] : params.images;

    if (!raw) {
      return [] as string[];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string' && Boolean(value)) : [];
    } catch {
      return [];
    }
  }, [params.images]);

  const viewMode = React.useMemo(() => {
    const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    return rawMode === 'preview' ? 'preview' : 'fullscreen';
  }, [params.mode]);

  const initialIndex = React.useMemo(() => {
    const rawIndex = Array.isArray(params.index) ? params.index[0] : params.index;
    const parsedNumber = Number(rawIndex ?? 0);
    if (!Number.isFinite(parsedNumber)) {
      return 0;
    }

    return Math.min(Math.max(parsedNumber, 0), Math.max(parsedImages.length - 1, 0));
  }, [params.index, parsedImages.length]);

  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (parsedImages.length === 0 || viewMode !== 'fullscreen') {
      return;
    }

    scrollViewRef.current?.scrollTo({
      x: currentIndex * width,
      y: 0,
      animated: false,
    });
  }, [currentIndex, parsedImages.length, viewMode, width]);

  const openFullscreenView = React.useCallback((index: number) => {
    router.push({
      pathname: '/products/gallery-view' as any,
      params: {
        images: JSON.stringify(parsedImages),
        index: String(index),
        mode: 'fullscreen',
      },
    });
  }, [parsedImages, router]);

  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((current) => {
      if (parsedImages.length === 0) {
        return 0;
      }

      return current > 0 ? current - 1 : parsedImages.length - 1;
    });
  }, [parsedImages.length]);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((current) => {
      if (parsedImages.length === 0) {
        return 0;
      }

      return current < parsedImages.length - 1 ? current + 1 : 0;
    });
  }, [parsedImages.length]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -50) {
            goToNext();
          } else if (gestureState.dx > 50) {
            goToPrevious();
          }
        },
      }),
    [goToNext, goToPrevious],
  );

  if (!parsedImages.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No images to display</Text>
      </View>
    );
  }

  if (viewMode === 'preview') {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
          <Text style={styles.previewTitle}>Images</Text>
          <View style={styles.previewSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.previewList} showsVerticalScrollIndicator={false}>
          {parsedImages.map((image, index) => (
            <Pressable
              key={`${image}-${index}`}
              onPress={() => openFullscreenView(index)}
              style={styles.previewCard}
            >
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>

      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {parsedImages.length}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.imageScrollContent}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          if (nextIndex >= 0 && nextIndex < parsedImages.length) {
            setCurrentIndex(nextIndex);
          }
        }}
      >
        {parsedImages.map((image, index) => (
          <Image
            key={`${image}-${index}`}
            source={{ uri: image }}
            style={[styles.image, { width }]}
            resizeMode="contain"
          />
        ))}
      </ScrollView>

      <View style={styles.navRow}>
        <Pressable onPress={goToPrevious} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </Pressable>
        <Pressable onPress={goToNext} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  previewSpacer: {
    width: 64,
  },
  previewList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 220,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageScrollContent: {
    alignItems: 'center',
  },
  image: {
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  counterBadge: {
    position: 'absolute',
    top: 54,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  navRow: {
    position: 'absolute',
    bottom: 44,
    width: '72%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  navButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
  },
});

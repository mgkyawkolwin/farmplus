import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SnackBarType = 'success' | 'error';

type SnackBarMessage = {
  message: string;
  type: SnackBarType;
};

type SnackBarComponentType = React.FC & {
  Success(message: string): void;
  Error(message: string): void;
};

let activeShowHandler: ((message: string, type: SnackBarType) => void) | null = null;

const showSnack = (message: string, type: SnackBarType) => {
  activeShowHandler?.(message, type);
};

const SnackBar: SnackBarComponentType = () => {
  const insets = useSafeAreaInsets();
  const [snackbar, setSnackbar] = useState<SnackBarMessage | null>(null);
  const snackbarOpacity = useRef(new Animated.Value(0)).current;
  const snackbarTranslateY = useRef(new Animated.Value(-24)).current;
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideSnackbar = useCallback(() => {
    if (snackbarTimer.current) {
      clearTimeout(snackbarTimer.current);
      snackbarTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(snackbarOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(snackbarTranslateY, {
        toValue: -24,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setSnackbar(null);
      }
    });
  }, [snackbarOpacity, snackbarTranslateY]);

  const showSnackbar = useCallback(
    (message: string, type: SnackBarType) => {
      if (snackbarTimer.current) {
        clearTimeout(snackbarTimer.current);
        snackbarTimer.current = null;
      }

      setSnackbar({ message, type });

      Animated.parallel([
        Animated.timing(snackbarOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(snackbarTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      snackbarTimer.current = setTimeout(() => {
        hideSnackbar();
      }, 2800);
    },
    [hideSnackbar, snackbarOpacity, snackbarTranslateY],
  );

  useEffect(() => {
    activeShowHandler = showSnackbar;

    return () => {
      if (activeShowHandler === showSnackbar) {
        activeShowHandler = null;
      }
      if (snackbarTimer.current) {
        clearTimeout(snackbarTimer.current);
        snackbarTimer.current = null;
      }
    };
  }, [showSnackbar]);

  if (!snackbar) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.snackbar,
        {
          backgroundColor: snackbar.type === 'success' ? '#2E7D32' : '#C62828',
          opacity: snackbarOpacity,
          transform: [{ translateY: snackbarTranslateY }],
          top: insets.top + 10,
        },
      ]}
    >
      <Text style={styles.snackbarText}>{snackbar.message}</Text>
    </Animated.View>
  );
};

SnackBar.Success = (message: string) => {
  showSnack(message, 'success');
};

SnackBar.Error = (message: string) => {
  showSnack(message, 'error');
};

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
    zIndex: 50,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SnackBar;

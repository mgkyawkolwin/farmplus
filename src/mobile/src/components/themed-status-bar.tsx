import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

type ThemedStatusBarProps = {
  animated?: boolean;
  backgroundColor?: string;
  barStyle?: string;
  className?: string;
  hidden?: boolean;
};

export function ThemedStatusBar({ animated, hidden }: ThemedStatusBarProps) {
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

  return (
    <ExpoStatusBar
      animated={animated}
      hidden={hidden}
      style={colorScheme === 'dark' ? 'light' : 'dark'}
    />
  );
}
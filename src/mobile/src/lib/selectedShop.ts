import * as React from 'react';

type Listener = () => void;

const listeners = new Set<Listener>();

/** Tell mounted screens that the selected shop changed so they can reload shop-specific data. */
export function notifySelectedShopChanged() {
  listeners.forEach((listener) => listener());
}

/** Runs `callback` whenever the user selects a different shop. */
export function useSelectedShopChanged(callback: () => void) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    const listener = () => callbackRef.current();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

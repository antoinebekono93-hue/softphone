import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useAppState(onChange?: (state: AppStateStatus) => void) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setAppState(nextState);
      callbackRef.current?.(nextState);
    });
    return () => subscription.remove();
  }, []);

  return appState;
}

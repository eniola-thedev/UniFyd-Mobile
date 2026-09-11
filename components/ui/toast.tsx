import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastKind = "success" | "error";
type ToastState = { id: number; message: string; kind: ToastKind } | null;

const ToastContext = createContext<{ show: (message: string, kind: ToastKind) => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (message: string, kind: ToastKind) => {
      const id = Date.now();
      setToast({ id, message, kind });
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast((t) => (t?.id === id ? null : t)));
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={{ opacity, position: "absolute", left: 16, right: 16, top: insets.top + 8 }}
        >
          <View className={`rounded-xl px-4 py-3 ${toast.kind === "success" ? "bg-secondary" : "bg-destructive"}`}>
            <Text className="text-center text-sm font-medium text-white">{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { show } = useContext(ToastContext);
  return {
    success: (message: string) => show(message, "success"),
    error: (message: string) => show(message, "error"),
  };
}

import { View, Text, Switch as RNSwitch } from "react-native";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-border bg-card p-5 ${className ?? ""}`}
      style={{ shadowColor: "#1B2436", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}
    >
      {children}
    </View>
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={`mb-1.5 text-sm font-medium text-foreground ${className ?? ""}`}>{children}</Text>;
}

export function Switch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#E7E8EC", true: "#149A6B" }}
      thumbColor="#FFFFFF"
    />
  );
}

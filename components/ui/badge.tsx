import { View, Text } from "react-native";

type Variant = "default" | "outline" | "muted" | "success" | "warning" | "destructive";

const styles: Record<Variant, { bg: string; text: string }> = {
  default: { bg: "bg-primary", text: "text-primary-foreground" },
  outline: { bg: "bg-transparent border border-border", text: "text-foreground" },
  muted: { bg: "bg-muted", text: "text-muted-foreground" },
  success: { bg: "bg-success", text: "text-success-foreground" },
  warning: { bg: "bg-warning", text: "text-warning-foreground" },
  destructive: { bg: "bg-destructive", text: "text-destructive-foreground" },
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const s = styles[variant];
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${s.bg} ${className ?? ""}`}>
      {typeof children === "string" ? (
        <Text className={`text-xs font-medium ${s.text}`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

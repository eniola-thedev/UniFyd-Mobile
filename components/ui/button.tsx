import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Variant = "default" | "outline" | "ghost" | "destructive";

const variantStyles: Record<Variant, string> = {
  default: "bg-primary",
  outline: "bg-transparent border border-border",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
};

const textStyles: Record<Variant, string> = {
  default: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive-foreground",
};

export function Button({
  children,
  onPress,
  variant = "default",
  loading = false,
  disabled,
  size = "default",
  className,
  ...props
}: PressableProps & {
  children: React.ReactNode;
  variant?: Variant;
  loading?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const isDisabled = disabled || loading;
  const sizeStyles = {
    default: "px-4 py-3",
    sm: "px-3 py-1.5",
    lg: "px-6 py-4",
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-xl ${sizeStyles[size]} active:opacity-80 ${variantStyles[variant]} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={variant === "default" ? "#FCFCFC" : "#149A6B"} />}
      {typeof children === "string" ? (
        <Text className={`text-center font-semibold ${textStyles[variant]}`}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

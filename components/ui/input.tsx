import { TextInput, type TextInputProps } from "react-native";

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#697182"
      className={`rounded-xl border border-input bg-white px-4 py-3 text-base text-foreground ${className ?? ""}`}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#697182"
      multiline
      textAlignVertical="top"
      className={`min-h-[120px] rounded-xl border border-input bg-white px-4 py-3 text-base text-foreground ${className ?? ""}`}
      {...props}
    />
  );
}

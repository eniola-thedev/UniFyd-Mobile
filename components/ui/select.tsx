import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

export type SelectOption = { value: string; label: string; group?: string };

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  // Group options in display order while preserving grouping if present.
  const groups = new Map<string | undefined, SelectOption[]>();
  for (const opt of options) {
    const key = opt.group;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(opt);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-input bg-white px-4 py-3"
      >
        <Text className={selected ? "text-base text-foreground" : "text-base text-muted-foreground"}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color="#697182" />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="mt-auto max-h-[70%] rounded-t-2xl bg-white p-4">
            <View className="mb-2 h-1.5 w-10 self-center rounded-full bg-border" />
            <ScrollView>
              {[...groups.entries()].map(([group, items]) => (
                <View key={group ?? "_"}>
                  {group && <Text className="mb-1 mt-3 px-2 text-xs font-semibold uppercase text-muted-foreground">{group}</Text>}
                  {items.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className="flex-row items-center justify-between rounded-lg px-3 py-3 active:bg-muted"
                    >
                      <Text className="text-base text-foreground">{opt.label}</Text>
                      {opt.value === value && <Check size={18} color="#149A6B" />}
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

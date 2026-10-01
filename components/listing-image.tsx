import { Image, View } from "react-native";
import { ImageOff } from "lucide-react-native";
import { useSignedUrl } from "@/hooks/use-signed-url";

export function ListingImage({
  path,
  className,
}: {
  path: string | null | undefined;
  className?: string;
}) {
  const url = useSignedUrl(path);

  if (!path || !url) {
    return (
      <View className={`h-full w-full items-center justify-center bg-muted ${className ?? ""}`}>
        <ImageOff size={28} color="#697182" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      className={`h-full w-full ${className ?? ""}`}
      resizeMode="cover"
    />
  );
}

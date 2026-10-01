import { useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const slides = [
  {
    eyebrow: "MADE FOR CAMPUS LIFE",
    title: "Your campus,\nyour marketplace.",
    description: "Find the everyday essentials students around you are buying and selling.",
  },
  {
    eyebrow: "STUDENT-ONLY COMMUNITY",
    title: "A little closer\nto home.",
    description: "Connect with verified students at your university and keep campus deals in reach.",
  },
  {
    eyebrow: "BUY WITH CONFIDENCE",
    title: "Good finds.\nBetter conversations.",
    description: "Message sellers directly, ask the important questions, and agree on the details.",
  },
  {
    eyebrow: "YOUR NEXT FIND IS HERE",
    title: "Make room for\nsomething new.",
    description: "List what you no longer need and discover what your next semester is missing.",
  },
];

function OnboardingIllustration({ step }: { step: number }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 280" fill="none">
      <Ellipse cx="160" cy="144" rx="130" ry="118" fill="#E3F6EC" />
      <Circle cx="47" cy="70" r="8" fill="#E3A730" />
      <Circle cx="267" cy="199" r="6" fill="#149A6B" opacity="0.45" />
      <Ellipse cx="160" cy="245" rx="92" ry="10" fill="#1B2A4A" opacity="0.08" />

      {step === 0 && (
        <>
          <Rect x="65" y="66" width="190" height="164" rx="22" fill="white" />
          <Rect x="83" y="84" width="154" height="27" rx="9" fill="#1B2A4A" />
          <Circle cx="103" cy="97.5" r="4" fill="#E3A730" />
          <Circle cx="118" cy="97.5" r="4" fill="#22B587" />
          <Rect x="84" y="124" width="152" height="88" rx="14" fill="#F1F2F5" />
          <Path d="M84 145h152v15H84z" fill="#22B587" />
          <Path d="M84 145h30l-8 15H84zm60 0h30l-8 15h-30zm60 0h30l-8 15h-30z" fill="#FCFCFC" />
          <Path d="M101 145v-9a12 12 0 0 1 24 0v9" stroke="#1B2A4A" strokeWidth="5" strokeLinecap="round" />
          <Rect x="96" y="158" width="34" height="38" rx="8" fill="#E3A730" />
          <Path d="M107 158v-4a6 6 0 0 1 12 0v4" stroke="#1B2A4A" strokeWidth="3" strokeLinecap="round" />
          <Rect x="148" y="171" width="62" height="7" rx="3.5" fill="#1B2A4A" opacity="0.82" />
          <Rect x="148" y="185" width="45" height="6" rx="3" fill="#697182" opacity="0.5" />
          <Rect x="206" y="48" width="53" height="43" rx="14" fill="#149A6B" />
          <Path d="M220 70h25m-12-12v24" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </>
      )}

      {step === 1 && (
        <>
          <Rect x="61" y="54" width="198" height="178" rx="22" fill="white" />
          <Rect x="79" y="72" width="162" height="18" rx="9" fill="#1B2A4A" />
          <Circle cx="116" cy="132" r="28" fill="#E3F6EC" />
          <Circle cx="116" cy="124" r="10" fill="#E3A730" />
          <Path d="M96 153c3-13 11-19 20-19s17 6 20 19" fill="#149A6B" />
          <Rect x="158" y="112" width="68" height="8" rx="4" fill="#1B2A4A" opacity="0.82" />
          <Rect x="158" y="128" width="53" height="6" rx="3" fill="#697182" opacity="0.45" />
          <Rect x="158" y="141" width="62" height="6" rx="3" fill="#697182" opacity="0.3" />
          <Path d="M96 175h128" stroke="#E7E8EC" strokeWidth="2" />
          <Rect x="96" y="189" width="83" height="22" rx="11" fill="#E3F6EC" />
          <Circle cx="109" cy="200" r="4" fill="#149A6B" />
          <Rect x="119" y="197" width="48" height="6" rx="3" fill="#215240" />
          <Circle cx="233" cy="197" r="25" fill="#149A6B" />
          <Path d="m222 197 8 8 15-17" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="77" cy="82" r="7" fill="#E3A730" />
        </>
      )}

      {step === 2 && (
        <>
          <Rect x="67" y="62" width="177" height="72" rx="20" fill="white" />
          <Circle cx="94" cy="98" r="15" fill="#E3F6EC" />
          <Circle cx="94" cy="94" r="5" fill="#E3A730" />
          <Path d="M84 108c2-6 5-9 10-9s8 3 10 9" fill="#149A6B" />
          <Rect x="120" y="83" width="97" height="7" rx="3.5" fill="#1B2A4A" opacity="0.8" />
          <Rect x="120" y="98" width="72" height="6" rx="3" fill="#697182" opacity="0.38" />
          <Path d="M91 134v11a10 10 0 0 0 10 10h12" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <Rect x="98" y="144" width="156" height="79" rx="20" fill="#149A6B" />
          <Circle cx="126" cy="183" r="15" fill="#FCFCFC" opacity="0.2" />
          <Path d="M116 193c2-6 5-9 10-9s8 3 10 9" fill="white" />
          <Circle cx="126" cy="179" r="5" fill="#E3A730" />
          <Rect x="151" y="166" width="81" height="7" rx="3.5" fill="white" />
          <Rect x="151" y="181" width="62" height="6" rx="3" fill="white" opacity="0.65" />
          <Rect x="151" y="195" width="43" height="6" rx="3" fill="white" opacity="0.4" />
          <Circle cx="248" cy="70" r="18" fill="#E3A730" />
          <Path d="m240 70 6 6 11-13" stroke="#1B2A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {step === 3 && (
        <>
          <Rect x="75" y="51" width="170" height="184" rx="22" fill="white" />
          <Rect x="92" y="68" width="136" height="20" rx="10" fill="#1B2A4A" />
          <Rect x="94" y="101" width="132" height="76" rx="13" fill="#E3F6EC" />
          <Path d="M139 155V125a21 21 0 0 1 42 0v30" stroke="#1B2A4A" strokeWidth="6" strokeLinecap="round" />
          <Rect x="127" y="143" width="66" height="25" rx="8" fill="#E3A730" />
          <Path d="M137 143v-6a5 5 0 0 1 10 0v6m25 0v-6a5 5 0 0 0-10 0v6" stroke="#1B2A4A" strokeWidth="3" strokeLinecap="round" />
          <Rect x="94" y="188" width="75" height="7" rx="3.5" fill="#1B2A4A" opacity="0.8" />
          <Rect x="94" y="202" width="53" height="6" rx="3" fill="#697182" opacity="0.4" />
          <Rect x="178" y="188" width="48" height="22" rx="11" fill="#149A6B" />
          <Circle cx="202" cy="199" r="4" fill="white" />
          <Circle cx="57" cy="192" r="22" fill="#E3A730" />
          <Path d="m47 192 7 7 13-15" stroke="#1B2A4A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="261" cy="91" r="8" fill="#149A6B" opacity="0.55" />
        </>
      )}
    </Svg>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  function openAuth(destination: "/(auth)/sign-in" | "/(auth)/sign-up") {
    router.replace(destination);
  }

  const illustrationHeight = Math.min(Math.max(height * 0.36, 180), 310);
  const isLastSlide = activeIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-12 flex-row items-center justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={() => openAuth("/(auth)/sign-in")}
            className="min-h-11 min-w-11 items-center justify-center px-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
          >
            <Text className="text-sm font-semibold text-muted-foreground">Skip</Text>
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <View
            className="w-full max-w-[360px]"
            style={{ height: illustrationHeight }}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <OnboardingIllustration step={activeIndex} />
          </View>
        </View>

        <View className="pb-3">
          <Text className="mb-3 text-xs font-bold text-primary">{activeSlide.eyebrow}</Text>
          <Text accessibilityRole="header" className="text-[30px] font-bold leading-9 text-foreground">
            {activeSlide.title}
          </Text>
          <Text className="mt-3 max-w-[350px] text-base leading-6 text-muted-foreground">
            {activeSlide.description}
          </Text>

          <View className="mt-7 flex-row items-center gap-3">
            {activeIndex > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous page"
                onPress={() => setActiveIndex((index) => index - 1)}
                className="h-14 w-14 items-center justify-center rounded-xl border border-border bg-card"
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
              >
                <ChevronLeft size={21} color="#1B2436" strokeWidth={2} />
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLastSlide ? "Create your account" : "Continue to next page"}
              onPress={() => {
                if (isLastSlide) {
                  openAuth("/(auth)/sign-up");
                } else {
                  setActiveIndex((index) => index + 1);
                }
              }}
              className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
            >
              <Text className="text-base font-semibold text-primary-foreground">
                {isLastSlide ? "Create account" : "Continue"}
              </Text>
              <ChevronRight size={19} color="#FCFCFC" strokeWidth={2} />
            </Pressable>
          </View>

          <View className="mt-5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5" accessible={false}>
              {slides.map((slide, index) => (
                <View
                  key={slide.eyebrow}
                  className={`h-1.5 rounded-full ${index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
                />
              ))}
            </View>
            <Text accessibilityLiveRegion="polite" className="text-xs font-medium text-muted-foreground">
              {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </Text>
          </View>

          <View className="mt-5 min-h-11 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-muted-foreground">Already have an account?</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => openAuth("/(auth)/sign-in")}
              className="min-h-11 justify-center px-1"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <Text className="text-sm font-semibold text-primary">Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
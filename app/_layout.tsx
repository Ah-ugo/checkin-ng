import { Colors } from "@/constants/Colors";
import { defaultConfig } from "@tamagui/config/v4";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { createTamagui, TamaguiProvider } from "tamagui";

import { useColorScheme } from "@/hooks/useColorScheme";

const config = createTamagui(defaultConfig);
const customDarkTheme = { ...MD3DarkTheme, colors: Colors.dark };
const customLightTheme = { ...MD3LightTheme, colors: Colors.light };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    InterRegular: require("../assets/fonts/Inter_28pt-Regular.ttf"),
    InterBold: require("../assets/fonts/Inter_24pt-Bold.ttf"),
    InterSemiBold: require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    InterMedium: require("../assets/fonts/Inter_18pt-Medium.ttf"),
  });

  const paperTheme =
    colorScheme === "dark" ? customDarkTheme : customLightTheme;

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <TamaguiProvider config={config}>
        {/* <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> */}
        {/* <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack> */}
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Slot />
        {/* </ThemeProvider> */}
      </TamaguiProvider>
    </PaperProvider>
  );
}

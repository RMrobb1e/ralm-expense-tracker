import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

import { HomeScreen } from "@/app/screens/home-screen";

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

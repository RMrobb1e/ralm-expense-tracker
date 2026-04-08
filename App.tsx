import { StatusBar } from "expo-status-bar";
import "./global.css";

import { HomeScreen } from "@/app/screens/home-screen";

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="dark" />
    </>
  );
}

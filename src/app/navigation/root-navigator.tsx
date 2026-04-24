import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/types";
import { EventDetailScreen } from "@/app/screens/event-detail-screen";
import { HomeScreen } from "@/app/screens/home-screen";
import { SettlementScreen } from "@/app/screens/settlement-screen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fafafa" },
          headerTintColor: "#18181b",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Events" }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: "Event" }}
        />
        <Stack.Screen
          name="Settlement"
          component={SettlementScreen}
          options={{ title: "Settlement" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

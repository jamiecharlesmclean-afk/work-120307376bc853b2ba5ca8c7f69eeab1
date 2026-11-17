import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { loadTeam } from "../lib/team";

export default function RootLayout() {
  // First launch: show the team setup until it is saved or skipped.
  useEffect(() => {
    void loadTeam().then((team) => {
      if (!team.setupDone) router.replace("/setup");
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}

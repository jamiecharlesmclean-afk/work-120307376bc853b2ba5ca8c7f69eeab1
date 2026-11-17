// Team details captured on first launch and editable later. Stored on the phone.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

export type StaffMember = { id: string; name: string; role: string };
export type TeamProfile = {
  teamName: string;
  season: string;
  competition: string;
  ageGroup: string;
  staff: StaffMember[];
  // True once the person saved or skipped the first-launch setup.
  setupDone: boolean;
};

const KEY = "hoopstats:team-profile";

export const EMPTY_TEAM: TeamProfile = { teamName: "", season: "", competition: "", ageGroup: "", staff: [], setupDone: false };

export async function loadTeam(): Promise<TeamProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_TEAM;
    return { ...EMPTY_TEAM, ...(JSON.parse(raw) as Partial<TeamProfile>) };
  } catch {
    return EMPTY_TEAM;
  }
}

export async function saveTeam(profile: TeamProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

// Reloads the profile each time the screen is shown, so edits appear at once.
export function useTeam(): { team: TeamProfile; loaded: boolean } {
  const [team, setTeam] = useState<TeamProfile>(EMPTY_TEAM);
  const [loaded, setLoaded] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadTeam().then((value) => {
        if (!active) return;
        setTeam(value);
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, []),
  );
  return { team, loaded };
}

// Headings that include the team name, e.g. "RIVERSIDE HAWKS · DRILL BOOK". Without a name, the text alone is used.
export function teamEyebrow(team: TeamProfile, text: string): string {
  const name = team.teamName.trim();
  return name ? `${name.toUpperCase()} · ${text}` : text;
}

export function teamSubtitle(team: TeamProfile, text: string): string {
  const name = team.teamName.trim();
  return name ? `${name} · ${text}` : text;
}

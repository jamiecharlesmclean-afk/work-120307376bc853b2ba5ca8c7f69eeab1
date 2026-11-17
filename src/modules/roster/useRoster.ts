// Roster state for the screens: loads players and templates, and saves changes to the phone.
import { useCallback, useState } from "react";
import { Player, StatTemplate } from "./model";
import { loadRoster, loadTemplates, saveCustomTemplate, saveRoster } from "./storage";

export function useRoster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [templates, setTemplates] = useState<StatTemplate[]>([]);

  const refresh = useCallback(async () => {
    const [nextPlayers, nextTemplates] = await Promise.all([loadRoster(), loadTemplates()]);
    setPlayers(nextPlayers);
    setTemplates(nextTemplates);
  }, []);

  const persist = useCallback((next: Player[]) => {
    setPlayers(next);
    void saveRoster(next);
  }, []);

  const addTemplate = useCallback(async (template: StatTemplate) => {
    await saveCustomTemplate(template);
    setTemplates(await loadTemplates());
  }, []);

  return { players, templates, refresh, persist, addTemplate };
}

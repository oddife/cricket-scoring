"use client";

import { useEffect } from "react";

const SKIP_TAGS = new Set(["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT", "OPTION"]);

type Entity = { id: string; name: string; type: "player" | "team" };

export default function ProfileLinkBridge() {
  useEffect(() => {
    let entities: Entity[] = [];
    let active = true;

    const load = async () => {
      try {
        const [playersResponse, teamsResponse] = await Promise.all([
          fetch("/api/players"),
          fetch("/api/teams"),
        ]);
        const [players, teams] = await Promise.all([
          playersResponse.ok ? playersResponse.json() : [],
          teamsResponse.ok ? teamsResponse.json() : [],
        ]);
        if (!active) return;
        entities = [
          ...players.map((player: { id: string; name: string }) => ({ id: player.id, name: player.name, type: "player" as const })),
          ...teams.map((team: { id: string; name: string }) => ({ id: team.id, name: team.name, type: "team" as const })),
        ];
      } catch {
        // Profile navigation is an enhancement; never block the scorer if it fails.
      }
    };

    void load();

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest<HTMLElement>("span, p, strong, em, h1, h2, h3, h4, h5, h6, div");
      if (!clickable || SKIP_TAGS.has(clickable.tagName) || clickable.closest("a,button,input,textarea,select")) return;

      const text = clickable.textContent?.trim();
      if (!text || text.length > 80) return;

      const matches = entities.filter((entity) => entity.name === text);
      if (matches.length !== 1) return;

      const entity = matches[0];
      clickable.dataset.profileLinked = "true";
      clickable.style.cursor = "pointer";
      clickable.title = `Open ${entity.type} profile`;
      window.location.href = entity.type === "player" ? `/profile/player/${entity.id}` : `/profile/team/${entity.id}`;
    };

    document.addEventListener("click", onClick);
    return () => {
      active = false;
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}

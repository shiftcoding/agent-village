/**
 * Agent name tags stay hidden until Ivan selects that agent: its character has keyboard focus (Tab, or a click or tap,
 * which also focuses it), or its details panel is open. Screen readers are unaffected: every character keeps its
 * aria-label, and the tags themselves are aria-hidden.
 */
export function tagShown(key: string, agentName: string | undefined, focusedKey: string | null, selectedAgent: string | null): boolean {
  if (focusedKey !== null && key === focusedKey) return true;
  return selectedAgent !== null && agentName === selectedAgent;
}

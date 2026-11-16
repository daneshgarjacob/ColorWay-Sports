
import { useSyncExternalStore } from "react";

// One tiny shared store for a quiz page. The questions are separate client
// islands (Mediavine ad slots sit between them in the server markup), so they
// can't share React state; they share this instead. Nothing is saved: reload
// and the quiz starts over, same as the TikTok.

export type Mark = "got" | "missed";

const marks = new Map<string, (Mark | undefined)[]>();
const listeners = new Set<() => void>();
const EMPTY: (Mark | undefined)[] = [];

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setMark(slug: string, index: number, mark: Mark | undefined) {
  const next = [...(marks.get(slug) ?? [])];
  next[index] = mark;
  marks.set(slug, next);
  emit();
}

export function useMarks(slug: string): (Mark | undefined)[] {
  return useSyncExternalStore(
    subscribe,
    () => marks.get(slug) ?? EMPTY,
    () => EMPTY,
  );
}

const noop = () => () => {};

/** False during the server render and hydration, true after: gates the JS-only buttons. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

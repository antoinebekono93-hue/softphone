"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Mirror a server-provided prop into local state.
 *
 * Server Component data arrives as a NEW array/object identity on every
 * `router.refresh()`. Seeding `useState(props)` once freezes the first render:
 * the RSC refetches, the parent re-renders with fresh props, and the local copy
 * silently keeps rendering the previous values. This hook re-derives on every
 * prop change while still allowing local optimistic edits.
 */
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [local, setLocal] = useState<T>(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return [local, setLocal];
}
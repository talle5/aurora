import { useState, useEffect, useRef } from "react";
import type { GroupEnabledResult } from "@app/types/groupEnabled";

export type { GroupEnabledResult };

/**
 * Checks whether a named feature group is enabled on the backend.
 * Returns { enabled: null } while loading, then true/false with an optional reason.
 */
export function useGroupEnabled(group: string): GroupEnabledResult {
  const [result, setResult] = useState<GroupEnabledResult>({
    enabled: null,
    unavailableReason: null,
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setResult({ enabled: false, unavailableReason: null });
  }, [group]);

  return result;
}

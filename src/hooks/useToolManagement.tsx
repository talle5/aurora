import { useState, useCallback, useMemo } from "react";
import { useToolRegistry } from "@app/contexts/ToolRegistryContext";
import { usePreferences } from "@app/contexts/PreferencesContext";
import {
  type ToolRegistryEntry,
  type ToolRegistry,
} from "@app/data/toolsTaxonomy";
import { useSelfHostedToolAvailability } from "@app/hooks/useSelfHostedToolAvailability";
import { useSaaSMode } from "@app/hooks/useSaaSMode";
import { FileId } from "@app/types/file";
import { ToolId } from "@app/types/toolId";
import type { EndpointDisableReason } from "@app/types/endpointAvailability";

export type ToolDisableCause =
  | "disabledByAdmin"
  | "missingDependency"
  | "unknown"
  | "selfHostedOffline";

export interface ToolAvailabilityInfo {
  available: boolean;
  reason?: ToolDisableCause;
}

export type ToolAvailabilityMap = Partial<Record<ToolId, ToolAvailabilityInfo>>;

interface ToolManagementResult {
  selectedTool: ToolRegistryEntry | null;
  toolSelectedFileIds: FileId[];
  toolRegistry: Partial<ToolRegistry>;
  setToolSelectedFileIds: (fileIds: FileId[]) => void;
  getSelectedTool: (toolKey: ToolId | null) => ToolRegistryEntry | null;
  toolAvailability: ToolAvailabilityMap;
}

export const useToolManagement = (): ToolManagementResult => {
  const [toolSelectedFileIds, setToolSelectedFileIds] = useState<FileId[]>([]);

  const { allTools } = useToolRegistry();
  const baseRegistry = allTools;
  const { preferences } = usePreferences();
  const isSaaSMode = useSaaSMode();

  const toolEndpointList = useMemo(
    () =>
      (Object.keys(baseRegistry) as ToolId[])
        // Exclude coming-soon tools (no component and no link) — they are already
        // unavailable regardless of server state and should not appear in the
        // self-hosted offline banner.
        .filter((id) => {
          const tool = baseRegistry[id];
          return !!(tool?.component ?? tool?.link);
        })
        .map((id) => ({
          id,
          endpoints: baseRegistry[id]?.endpoints ?? [],
        })),
    [baseRegistry],
  );
  const selfHostedOfflineIds = useSelfHostedToolAvailability(toolEndpointList);

  const isToolAvailable = () => true;

  const deriveToolDisableReason = () => "unknown";

  const toolAvailability = useMemo(() => {
    // Skip computation during loading UNLESS some tools are already known offline.
    // In self-hosted offline mode endpointsLoading never clears, so we must still
    // compute the map to surface the selfHostedOfflineIds set.
    if (selfHostedOfflineIds.size === 0) {
      return {};
    }
    const availability: ToolAvailabilityMap = {};
    return availability;
  }, [
    baseRegistry,
    deriveToolDisableReason,
    isToolAvailable,
    selfHostedOfflineIds,
  ]);

  const toolRegistry: Partial<ToolRegistry> = useMemo(() => {
    const availableToolRegistry: Partial<ToolRegistry> = {};
    (Object.keys(baseRegistry) as ToolId[]).forEach((toolKey) => {
      const baseTool = baseRegistry[toolKey];
      if (!baseTool) return;
      const availabilityInfo = toolAvailability[toolKey];
      const isAvailable = availabilityInfo
        ? availabilityInfo.available !== false
        : true;

      // Check if tool is "coming soon" (has no component and no link)
      const isComingSoon =
        !baseTool.component &&
        !baseTool.link &&
        toolKey !== "read" &&
        toolKey !== "multiTool";

      if (preferences.hideUnavailableTools && (!isAvailable || isComingSoon)) {
        return;
      }
      availableToolRegistry[toolKey] = baseTool;
    });
    return availableToolRegistry;
  }, [baseRegistry, preferences.hideUnavailableTools, toolAvailability]);

  const getSelectedTool = useCallback(
    (toolKey: ToolId | null): ToolRegistryEntry | null => {
      return toolKey ? toolRegistry[toolKey] || null : null;
    },
    [toolRegistry],
  );

  return {
    selectedTool: getSelectedTool(null),
    toolSelectedFileIds,
    toolRegistry,
    setToolSelectedFileIds,
    getSelectedTool,
    toolAvailability,
  };
};

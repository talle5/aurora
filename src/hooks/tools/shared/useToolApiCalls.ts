import { useCallback, useRef } from "react";
import axios, { type CancelTokenSource } from "axios"; // Real axios for static methods (CancelToken, isCancel)
import {
  processResponse,
  ResponseHandler,
} from "@app/utils/toolResponseProcessor";
import { isEmptyOutput } from "@app/services/errorUtils";
import type { ProcessingProgress } from "@app/hooks/tools/shared/useToolState";
import type { StirlingFile, FileId } from "@app/types/fileContext";

export interface ApiCallsConfig<TParams = void> {
  endpoint: string | null | ((params: TParams) => string | null);
  buildFormData: (params: TParams, file: File) => FormData;
  filePrefix?: string;
  responseHandler?: ResponseHandler;
  preserveBackendFilename?: boolean;
}

export const useToolApiCalls = <TParams = void>() => {
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  const processFiles = useCallback(
    async (
      params: TParams,
      validFiles: StirlingFile[],
      config: ApiCallsConfig<TParams>,
      onProgress: (progress: ProcessingProgress) => void,
      onStatus: (status: string) => void,
      markFileError?: (fileId: FileId) => void,
    ): Promise<{ outputFiles: File[]; successSourceIds: FileId[] }> => {
      const processedFiles: File[] = [];
      const successSourceIds: FileId[] = [];
      const failedFiles: string[] = [];
      const total = validFiles.length;

      // Create cancel token for this operation
      cancelTokenRef.current = axios.CancelToken.source();

      // Params are the same for every file, so resolve the endpoint once. A null
      // endpoint means the tool has no backend call (e.g. client-side tools) and
      // should never reach here, so fail loudly rather than POST to null.
      const endpoint =
        typeof config.endpoint === "function"
          ? config.endpoint(params)
          : config.endpoint;
      if (!endpoint) {
        throw new Error(
          "This operation has no backend endpoint and cannot be executed directly.",
        );
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        console.debug("[processFiles] Start", {
          index: i,
          total,
          name: file.name,
          fileId: file.fileId,
        });
        onProgress({ current: i + 1, total, currentFileName: file.name });
        onStatus(`Processing ${file.name} (${i + 1}/${total})`);
      }

      if (failedFiles.length > 0 && processedFiles.length === 0) {
        throw new Error(
          `Failed to process all files: ${failedFiles.join(", ")}`,
        );
      }

      if (failedFiles.length > 0) {
        onStatus(
          `Processed ${processedFiles.length}/${total} files. Failed: ${failedFiles.join(", ")}`,
        );
      } else {
        onStatus(
          `Successfully processed ${processedFiles.length} file${processedFiles.length === 1 ? "" : "s"}`,
        );
      }

      console.debug("[processFiles] Completed batch", {
        total,
        successes: successSourceIds.length,
        outputs: processedFiles.length,
        failed: failedFiles.length,
      });
      return { outputFiles: processedFiles, successSourceIds };
    },
    [],
  );

  const cancelOperation = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("Operation cancelled by user");
      cancelTokenRef.current = null;
    }
  }, []);

  return {
    processFiles,
    cancelOperation,
  };
};

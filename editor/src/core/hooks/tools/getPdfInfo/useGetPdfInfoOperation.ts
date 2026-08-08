import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileContext } from "@app/contexts/file/fileHooks";
import { ToolOperationHook } from "@app/hooks/tools/shared/useToolOperation";
import type { StirlingFile } from "@app/types/fileContext";
import { extractErrorMessage } from "@app/utils/toolErrorHandler";
import { PdfInfoReportEntry, INFO_JSON_FILENAME } from "@app/types/getPdfInfo";
import type { GetPdfInfoParameters } from "@app/hooks/tools/getPdfInfo/useGetPdfInfoParameters";
import { invoke } from "@app/brain/pdf-cpu";

export interface GetPdfInfoOperationHook extends ToolOperationHook<GetPdfInfoParameters> {
  results: PdfInfoReportEntry[];
}

export const useGetPdfInfoOperation = (): GetPdfInfoOperationHook => {
  const { t } = useTranslation();
  const { selectors } = useFileContext();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<PdfInfoReportEntry[]>([]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const executeOperation = useCallback(
    async (_params: GetPdfInfoParameters, selectedFiles: StirlingFile[]) => {
      if (selectedFiles.length === 0) {
        setErrorMessage(t("noFileSelected", "No file loaded"));
        return;
      }

      setIsLoading(true);
      setStatus(t("getPdfInfo.processing", "Extracting information..."));
      setErrorMessage(null);
      setResults([]);
      setFiles([]);

      try {
        const aggregated: PdfInfoReportEntry[] = [];
        const generatedAt = Date.now();

        for (const file of selectedFiles) {

          const formData = new FormData();
          formData.append("fileInput", file);

          try {
            const byteArray = await invoke("getInfo", selectedFiles);
            const jsonString = new TextDecoder().decode(byteArray[0]);
            const response = JSON.parse(jsonString);
            console.log(response);

            const stub = selectors.getStirlingFileStub(file.fileId);

            
            const entry: PdfInfoReportEntry = {
              fileId: file.fileId,
              fileName: file.name,
              fileSize: file.size ?? null,
              lastModified: file.lastModified ?? null,
              thumbnailUrl: stub?.thumbnailUrl ?? null,
              data: response ?? {},
              error: null,
              summaryGeneratedAt: generatedAt,
            };
            aggregated.push(entry);
          } catch (error) {
            const stub = selectors.getStirlingFileStub(file.fileId);
            aggregated.push({
              fileId: file.fileId,
              fileName: file.name,
              fileSize: file.size ?? null,
              lastModified: file.lastModified ?? null,
              thumbnailUrl: stub?.thumbnailUrl ?? null,
              data: {},
              error: extractErrorMessage(error),
              summaryGeneratedAt: generatedAt,
            });
          }
        }

        setResults(aggregated);
        if (aggregated.length > 0) {
          // Build V1-compatible JSON: use backend payloads directly.
          const payloads = aggregated
            .filter((e) => !e.error)
            .map((e) => e.data);
          const content = payloads.length === 1 ? payloads[0] : payloads;
          const json = JSON.stringify(content, null, 2);
          const resultFile = new File([json], INFO_JSON_FILENAME, {
            type: "application/json",
          });
          setFiles([resultFile]);
        }

        const anyError = aggregated.some((item) => item.error);
        if (anyError) {
          setErrorMessage(
            t(
              "getPdfInfo.error.partial",
              "Some files could not be processed.",
            ),
          );
        }
        setStatus(t("getPdfInfo.status.complete", "Extraction complete"));
      } catch (e) {
        console.error("[getPdfInfo] unexpected failure", e);
        setErrorMessage(
          t(
            "getPdfInfo.error.unexpected",
            "Unexpected error during extraction.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [selectors, t],
  );

  const cancelOperation = useCallback(() => {
    if (isLoading) {
      setIsLoading(false);
      setStatus(t("operationCancelled", "Operation cancelled"));
    }
  }, [isLoading, t]);

  return useMemo<GetPdfInfoOperationHook>(
    () => ({
      files,
      thumbnails: [],
      isGeneratingThumbnails: false,
      downloadUrl: "",
      downloadFilename: "",
      isLoading,
      status,
      errorMessage,
      progress: null,
      executeOperation,
      resetResults: () =>{},
      clearError,
      cancelOperation,
      undoOperation: () => ({} as any),
      results,
    }),
    [
      cancelOperation,
      clearError,
      errorMessage,
      executeOperation,
      files,
      isLoading,
      results,
      status,
    ],
  );
};

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileContext } from "@app/contexts/file/fileHooks";
import { ToolOperationHook } from "@app/hooks/tools/shared/useToolOperation";
import type { StirlingFile } from "@app/types/fileContext";
import { extractErrorMessage } from "@app/utils/toolErrorHandler";
import {
  SignatureValidationBackendResult,
  SignatureValidationFileResult,
  SignatureValidationReportEntry,
} from "@app/types/validateSignature";
import { ValidateSignatureParameters } from "@app/hooks/tools/validateSignature/useValidateSignatureParameters";
import {
  normalizeBackendResult,
} from "@app/hooks/tools/validateSignature/utils/signatureUtils";
import { invoke } from "@app/brain/pdf-cpu";

export interface ValidateSignatureOperationHook extends ToolOperationHook<ValidateSignatureParameters> {
  results: SignatureValidationReportEntry[];
}

export const useValidateSignatureOperation =
  (): ValidateSignatureOperationHook => {
    const { t } = useTranslation();
    const { selectors } = useFileContext();
    const [status, setStatus] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadFilename, setDownloadFilename] = useState("");
    const [results, setResults] = useState<SignatureValidationReportEntry[]>(
      [],
    );

    const resetResults = useCallback(() => {
      setResults([]);
      setFiles([]);
      setDownloadUrl(null);
      setDownloadFilename("");
      setStatus("");
      setErrorMessage(null);
    }, []);

    const clearError = useCallback(() => {
      setErrorMessage(null);
    }, []);

    const undoOperation = useCallback(async () => {
      resetResults();
    }, [resetResults]);

    const executeOperation = useCallback(
      async (
        params: ValidateSignatureParameters,
        selectedFiles: StirlingFile[],
      ) => {
        if (selectedFiles.length === 0) {
          setErrorMessage(t("noFileSelected", "No files selected"));
          return;
        }

        setStatus(
          t("validateSignature.processing", "Validating signatures..."),
        );
        setErrorMessage(null);
        setResults([]);
        setFiles([]);
        setDownloadUrl(null);
        setDownloadFilename("");

        try {
          const aggregated: SignatureValidationFileResult[] = [];

          for (const file of selectedFiles) {
            try {
              const resultBytes = await invoke("validateSignatures", [file]);
              const jsonString = new TextDecoder("utf-8").decode(resultBytes);
              const data = JSON.parse(jsonString) as SignatureValidationBackendResult[];

              const signatures = data.map((item, index) =>
                normalizeBackendResult(item, file, index),
              );

              aggregated.push({
                fileId: file.fileId,
                fileName: file.name,
                signatures,
                error: null,
                fileSize: file.size ?? null,
                lastModified: file.lastModified ?? null,
              });
            } catch (error) {
              aggregated.push({
                fileId: file.fileId,
                fileName: file.name,
                signatures: [],
                error: extractErrorMessage(error),
                fileSize: file.size ?? null,
                lastModified: file.lastModified ?? null,
              });
            }
          }
        } catch (e) {
          console.error("[validateSignature] unexpected failure", e);
          setErrorMessage(
            t(
              "validateSignature.error.unexpected",
              "Unexpected error during validation.",
            ),
          );
        }
      },
      [selectors, t],
    );

    return useMemo(
      () => ({
        files,
        thumbnails: [],
        isGeneratingThumbnails: false,
        downloadUrl,
        downloadFilename,
        isLoading: false,
        status,
        errorMessage,
        progress: null,
        executeOperation,
        resetResults,
        clearError,
        cancelOperation: () => { },
        undoOperation,
        results,
      }),
      [
        clearError,
        downloadFilename,
        downloadUrl,
        errorMessage,
        executeOperation,
        files,
        resetResults,
        results,
        status,
        undoOperation,
      ],
    );
  };

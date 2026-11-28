import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { OverlayPdfsParameters } from "@app/hooks/tools/overlayPdfs/useOverlayPdfsParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: OverlayPdfsParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[overlayPdfs] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const overlayPdfsOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "overlayPdfs",
  filePrefix: "overlayPdfs_",
});

export const useOverlayPdfsOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<OverlayPdfsParameters>({
    ...overlayPdfsOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("overlay-pdfs.error.failed", "An error occurred while overlaying PDFs."),
    ),
  });
};

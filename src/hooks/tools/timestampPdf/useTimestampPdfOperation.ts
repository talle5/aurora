import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { TimestampPdfParameters } from "@app/hooks/tools/timestampPdf/useTimestampPdfParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: TimestampPdfParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[timestampPdf] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const timestampPdfOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "timestampPdf",
  filePrefix: "timestampPdf_",
});

export const useTimestampPdfOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<TimestampPdfParameters>({
    ...timestampPdfOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("timestampPdf.error.failed", "An error occurred while timestamping the PDF."),
    ),
  });
};

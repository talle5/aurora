import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { SanitizeParameters } from "@app/hooks/tools/sanitize/useSanitizeParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: SanitizeParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[sanitize] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const sanitizeOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "sanitize",
  filePrefix: "sanitize_",
});

export const useSanitizeOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<SanitizeParameters>({
    ...sanitizeOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("sanitize.error.failed", "An error occurred while sanitising the PDF."),
    ),
  });
};

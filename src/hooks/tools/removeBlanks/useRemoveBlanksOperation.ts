import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RemoveBlanksParameters } from "@app/hooks/tools/removeBlanks/useRemoveBlanksParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: RemoveBlanksParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[removeBlanks] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const removeBlanksOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "removeBlanks",
  filePrefix: "removeBlanks_",
});

export const useRemoveBlanksOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RemoveBlanksParameters>({
    ...removeBlanksOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("removeBlanks.error.failed", "Failed to remove blank pages"),
    ),
  });
};

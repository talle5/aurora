import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { ReorganizePagesParameters } from "@app/hooks/tools/reorganizePages/useReorganizePagesParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: ReorganizePagesParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[reorganizePages] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const reorganizePagesOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "reorganizePages",
  filePrefix: "reorganizePages_",
});

export const useReorganizePagesOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<ReorganizePagesParameters>({
    ...reorganizePagesOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("reorganizePages.error.failed", "Failed to reorganize pages"),
    ),
  });
};

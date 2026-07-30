import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { ReplaceColorParameters } from "@app/hooks/tools/replaceColor/useReplaceColorParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: ReplaceColorParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[replaceColor] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const replaceColorOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "replaceColor",
  filePrefix: "replaceColor_",
});

export const useReplaceColorOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<ReplaceColorParameters>({
    ...replaceColorOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("replaceColor.error.failed", "An error occurred while processing the colour replacement."),
    ),
  });
};

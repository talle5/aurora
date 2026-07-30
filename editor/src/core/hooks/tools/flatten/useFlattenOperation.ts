import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { FlattenParameters } from "@app/hooks/tools/flatten/useFlattenParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: FlattenParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[flatten] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const flattenOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "flatten",
  filePrefix: "flatten_",
});

export const useFlattenOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<FlattenParameters>({
    ...flattenOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("flatten.error.failed", "An error occurred while flattening the PDF."),
    ),
  });
};

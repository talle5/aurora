import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { SplitParameters } from "@app/hooks/tools/split/useSplitParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: SplitParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[split] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const splitOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "split",
  filePrefix: "split_",
});

export const useSplitOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<SplitParameters>({
    ...splitOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("split.error.failed", "An error occurred while splitting the PDF."),
    ),
  });
};

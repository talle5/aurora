import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { AutoRenameParameters } from "@app/hooks/tools/autoRename/useAutoRenameParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: AutoRenameParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[autoRename] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const autoRenameOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "autoRename",
  filePrefix: "autoRename_",
});

export const useAutoRenameOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AutoRenameParameters>({
    ...autoRenameOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("auto-rename.error.failed", "An error occurred while auto-renaming the PDF."),
    ),
  });
};

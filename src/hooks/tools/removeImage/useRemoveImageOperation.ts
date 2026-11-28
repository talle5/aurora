import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RemoveImageParameters } from "@app/hooks/tools/removeImage/useRemoveImageParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: RemoveImageParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[removeImage] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const removeImageOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "removeImage",
  filePrefix: "removeImage_",
});

export const useRemoveImageOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RemoveImageParameters>({
    ...removeImageOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("removeImage.error.failed", "Failed to remove images from the PDF."),
    ),
  });
};

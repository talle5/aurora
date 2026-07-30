import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { EditTableOfContentsParameters } from "@app/hooks/tools/editTableOfContents/useEditTableOfContentsParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: EditTableOfContentsParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[editTableOfContents] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const editTableOfContentsOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "editTableOfContents",
  filePrefix: "editTableOfContents_",
});

export const useEditTableOfContentsOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<EditTableOfContentsParameters>({
    ...editTableOfContentsOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("editTableOfContents.error.failed", "Failed to update the table of contents"),
    ),
  });
};

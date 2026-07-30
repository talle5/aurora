import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { PageLayoutParameters } from "@app/hooks/tools/pageLayout/usePageLayoutParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: PageLayoutParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[pageLayout] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const pageLayoutOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "pageLayout",
  filePrefix: "pageLayout_",
});

export const usePageLayoutOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<PageLayoutParameters>({
    ...pageLayoutOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("pageLayout.error.failed", "An error occurred while creating the multi-page layout."),
    ),
  });
};

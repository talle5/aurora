import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { SingleLargePageParameters } from "@app/hooks/tools/singleLargePage/useSingleLargePageParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: SingleLargePageParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[pdfToSinglePage] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const singleLargePageOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "pdfToSinglePage",
  filePrefix: "pdfToSinglePage_",
});

export const usePdfToSinglePageOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<SingleLargePageParameters>({
    ...singleLargePageOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("pdfToSinglePage.error.failed", "An error occurred while converting to single page."),
    ),
  });
};

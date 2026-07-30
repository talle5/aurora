import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { BookletImpositionParameters } from "@app/hooks/tools/bookletImposition/useBookletImpositionParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: BookletImpositionParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[bookletImposition] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const bookletImpositionOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "bookletImposition",
  filePrefix: "bookletImposition_",
});

export const useBookletImpositionOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<BookletImpositionParameters>({
    ...bookletImpositionOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("bookletImposition.error.failed", "An error occurred while creating the booklet imposition."),
    ),
  });
};

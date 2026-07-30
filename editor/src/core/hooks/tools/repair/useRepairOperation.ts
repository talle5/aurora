import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RepairParameters } from "@app/hooks/tools/repair/useRepairParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: RepairParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[repair] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const repairOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "repair",
  filePrefix: "repair_",
});

export const useRepairOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RepairParameters>({
    ...repairOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("repair.error.failed", "An error occurred while repairing the PDF."),
    ),
  });
};

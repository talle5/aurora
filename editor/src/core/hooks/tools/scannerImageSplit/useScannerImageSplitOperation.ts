import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { ScannerImageSplitParameters } from "@app/hooks/tools/scannerImageSplit/useScannerImageSplitParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: ScannerImageSplitParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[scannerImageSplit] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const scannerImageSplitOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "scannerImageSplit",
  filePrefix: "scannerImageSplit_",
});

export const useScannerImageSplitOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<ScannerImageSplitParameters>({
    ...scannerImageSplitOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("scannerImageSplit.error.failed", "An error occurred while extracting image scans."),
    ),
  });
};

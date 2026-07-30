import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { OCRParameters } from "@app/hooks/tools/ocr/useOCRParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: OCRParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[ocr] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const ocrOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "ocr",
  filePrefix: "ocr_",
});

export const useOcrOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<OCRParameters>({
    ...ocrOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("ocr.error.failed", "OCR operation failed"),
    ),
  });
};

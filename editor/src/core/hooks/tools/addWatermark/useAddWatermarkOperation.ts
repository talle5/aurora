import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { AddWatermarkParameters } from "@app/hooks/tools/addWatermark/useAddWatermarkParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: AddWatermarkParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[watermark] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const addWatermarkOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "watermark",
  filePrefix: "watermark_",
});

export const useWatermarkOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AddWatermarkParameters>({
    ...addWatermarkOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("watermark.error.failed", "An error occurred while adding watermark to the PDF."),
    ),
  });
};

import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { AddWatermarkParameters } from "@app/hooks/tools/addWatermark/useAddWatermarkParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<AddWatermarkParameters>(
  "addWaterMark",
  "watermark.pdf",
);

export const addWatermarkOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "watermark",
  filePrefix: "watermark_",
});

export const useAddWatermarkOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AddWatermarkParameters>({
    ...addWatermarkOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("watermark.error.failed", "An error occurred while adding watermark to the PDF."),
    ),
  });
};

import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { AdjustPageScaleParameters } from "@app/hooks/tools/adjustPageScale/useAdjustPageScaleParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<AdjustPageScaleParameters>(
  "zoom",
  "watermark.pdf",
);

export const adjustPageScaleOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "scalePages",
  filePrefix: "scalePages_",
});

export const useAdjustPageScaleOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AdjustPageScaleParameters>({
    ...adjustPageScaleOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("adjustPageScale.error.failed", "An error occurred while adjusting the page scale."),
    ),
  });
};

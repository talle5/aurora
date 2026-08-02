import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineCustomTool,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  CropParameters,
  defaultParameters,
} from "@app/hooks/tools/crop/useCropParameters";
import { createSimpleCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createSimpleCustomProcessor<CropParameters>(
  "crop",
  "removed_signatures_output.pdf",
);

export const cropOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "crop",
  filePrefix: "crop_",
  defaultParameters,
});

export const useCropOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<CropParameters>({
    ...cropOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("crop.error.failed", "An error occurred while cropping the PDF."),
    ),
  });
};

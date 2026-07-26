import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  CustomProcessorResult,
  defineCustomTool,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  CropParameters,
  defaultParameters,
} from "@app/hooks/tools/crop/useCropParameters";
import { invoke } from "@app/brain/pdf-cpu";

const customProcessor = async (
  parameters: CropParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  const resultData = await invoke("crop", files, parameters.cropArea);
  const file = new File([resultData as BlobPart], "merged_output.pdf", {
    type: "application/pdf"
  });
  return { files: [file], consumedAllInputs: true };
};

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

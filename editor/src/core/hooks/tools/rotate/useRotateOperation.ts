import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineCustomTool,
  type CustomProcessorResult,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  RotateParameters,
  defaultParameters,
  normalizeAngle,
} from "@app/hooks/tools/rotate/useRotateParameters";

import { invoke } from "@app/brain/pdf-cpu";

const customProcessor = async (
  parameters: RotateParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  const file = await invoke("rotate", files, normalizeAngle(parameters.angle))
  const resultFile = new File([file as BlobPart], "merged_output.pdf", {
    type: "application/pdf"
  });
  return { files: [resultFile], consumedAllInputs: true };

};

// Static configuration object
export const rotateOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "rotate",
  filePrefix: "rotate_",
  defaultParameters,
});

export const useRotateOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RotateParameters>({
    ...rotateOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("rotate.error.failed", "An error occurred while rotating the PDF."),
    ),
  });
};

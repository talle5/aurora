import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineCustomTool,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  RotateParameters,
  defaultParameters,
} from "@app/hooks/tools/rotate/useRotateParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<RotateParameters>(
  "rotate",
  "removed_signatures_output.pdf",
);

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

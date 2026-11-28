import { useTranslation } from "react-i18next";
import {
  useToolOperation,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  UnlockPdfFormsParameters,
  defaultParameters,
} from "@app/hooks/tools/unlockPdfForms/useUnlockPdfFormsParameters";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<UnlockPdfFormsParameters>(
  "unlockForm",
  "unlocked.pdf",
);

export const unlockPdfFormsOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "addPassword",
  filePrefix: "addPassword_",
  defaultParameters,
});

export const useUnlockPdfFormsOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<UnlockPdfFormsParameters>({
    ...unlockPdfFormsOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "unlockPDFForms.error.failed",
        "An error occurred while unlocking PDF forms.",
      ),
    ),
  });
};

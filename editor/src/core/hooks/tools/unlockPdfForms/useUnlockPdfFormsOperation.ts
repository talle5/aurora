import { useTranslation } from "react-i18next";
import {
  useToolOperation,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  UnlockPdfFormsParameters,
  defaultParameters,
} from "@app/hooks/tools/unlockPdfForms/useUnlockPdfFormsParameters";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { invoke } from "@app/brain/pdf-cpu";

export const customProcessor = async (
  _parameters: UnlockPdfFormsParameters,
  files: File[]): Promise<CustomProcessorResult> => {
  const resultData = await invoke("unlockForm", files);
  const file = new File([resultData as BlobPart], "merged_output.pdf", {
    type: "application/pdf"
  });
  return { files: [file], consumedAllInputs: true };
};

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

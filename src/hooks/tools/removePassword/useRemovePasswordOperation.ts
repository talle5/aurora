import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RemovePasswordParameters } from "@app/hooks/tools/removePassword/useRemovePasswordParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<RemovePasswordParameters>(
  "removePassword",
  "watermark.pdf",
);

export const removePasswordOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "removePassword",
  filePrefix: "removePassword_",
});

export const useRemovePasswordOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RemovePasswordParameters>({
    ...removePasswordOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("removePassword.error.failed", "An error occurred while removing the password from the PDF."),
    ),
  });
};

import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RemovePagesParameters } from "@app/hooks/tools/removePages/useRemovePagesParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<RemovePagesParameters>(
  "removePages",
  "remove.pdf",
);

export const removePagesOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "removePages",
  filePrefix: "removePages_",
});

export const useRemovePagesOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RemovePagesParameters>({
    ...removePagesOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("removePages.error.failed", "Failed to remove pages"),
    ),
  });
};

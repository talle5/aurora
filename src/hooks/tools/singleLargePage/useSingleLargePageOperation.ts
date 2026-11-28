import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { SingleLargePageParameters } from "@app/hooks/tools/singleLargePage/useSingleLargePageParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<SingleLargePageParameters>(
  "singlePage",
  "watermark.pdf",
);

export const singleLargePageOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "pdfToSinglePage",
  filePrefix: "pdfToSinglePage_",
});

export const useSingleLargePageOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<SingleLargePageParameters>({
    ...singleLargePageOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("pdfToSinglePage.error.failed", "An error occurred while converting to single page."),
    ),
  });
};

import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { ExtractImagesParameters } from "@app/hooks/tools/extractImages/useExtractImagesParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<ExtractImagesParameters>(
  "extractImages",
  (i: any, _total: any, _params: any) => ({ name: `page_${i}.pdf`, mimeType: "image/jpeg" }),
);

export const extractImagesOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "extractImages",
  filePrefix: "extractImages_",
});

export const useExtractImagesOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<ExtractImagesParameters>({
    ...extractImagesOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("extractImages.error.failed", "An error occurred while extracting images from the PDF."),
    ),
  });
};

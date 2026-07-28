import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineSingleFileTool,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  SingleLargePageParameters,
  defaultParameters,
} from "@app/hooks/tools/singleLargePage/useSingleLargePageParameters";

// Static function that can be used by both the hook and automation executor
export const buildSingleLargePageFormData = (
  _parameters: SingleLargePageParameters,
  file: File,
): FormData => objectToFormData(toApiParams(), { fileInput: file });

// Static configuration object
export const singleLargePageOperationConfig = defineSingleFileTool({
  buildFormData: buildSingleLargePageFormData,
  toApiParams,
  fromApiParams,
  operationType: "pdfToSinglePage",
  endpoint: ENDPOINT,
  defaultParameters,
});

export const useSingleLargePageOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<SingleLargePageParameters>({
    ...singleLargePageOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "pdfToSinglePage.error.failed",
        "An error occurred while converting to single page.",
      ),
    ),
  });
};

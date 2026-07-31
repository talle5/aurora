import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineCustomTool,
  type CustomProcessorResult,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  MergeParameters,
  defaultParameters,
} from "@app/hooks/tools/merge/useMergeParameters";
import { createSimpleCustomProcessor} from "@app/brain/pdf-cpu";

const customProcessor = createSimpleCustomProcessor<MergeParameters>(
  "merge",
  "removed_signatures_output.pdf",
);

export const mergeOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "merge",
  filePrefix: "merged_",
  defaultParameters,
});

export const useMergeOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<MergeParameters>({
    ...mergeOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("merge.error.failed", "An error occurred while merging the PDFs."),
    ),
  });
};


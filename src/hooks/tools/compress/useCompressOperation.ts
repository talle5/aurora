import { useTranslation } from "react-i18next";
import {
  useToolOperation
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  CompressParameters,
  defaultParameters,
} from "@app/hooks/tools/compress/useCompressParameters";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { invoke } from "@app/brain/pdf-cpu";

const customProcessor = async (
  parameters: CompressParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  const file = new File([await invoke("optimize",files) as BlobPart], "merged_output.pdf", {
    type: "application/pdf"
  });
  return { files: [file], consumedAllInputs: true };
};

export const compressOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "compress",
  filePrefix: "compress_",
  defaultParameters,
});

export const useCompressOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<CompressParameters>({
    ...compressOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "compress.error.failed",
        "An error occurred while compressing the PDF.",
      ),
    ),
  });
};

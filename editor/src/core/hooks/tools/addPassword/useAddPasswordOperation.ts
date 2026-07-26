import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineCustomTool,
  CustomProcessorResult,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  AddPasswordParameters,
  defaultParameters,
} from "@app/hooks/tools/addPassword/useAddPasswordParameters";
import { invoke } from "@app/brain/pdf-cpu";
const customProcessor = async (
  parameters: AddPasswordParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.log(parameters)
  const resultData = await invoke("encrypt", files,parameters.password,parameters.ownerPassword);
  const file = new File([resultData as BlobPart], "merged_output.pdf", {
    type: "application/pdf"
  });
  return { files: [file], consumedAllInputs: true };
};

export const addPasswordOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "addPassword",
  filePrefix: "addPassword_",
  defaultParameters,
});

export const useAddPasswordOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AddPasswordParameters>({
    ...addPasswordOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "addPassword.error.failed",
        "An error occurred while encrypting the PDF.",
      ),
    ),
  });
};

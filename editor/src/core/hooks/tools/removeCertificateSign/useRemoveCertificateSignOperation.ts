import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RemoveCertificateSignParameters } from "@app/hooks/tools/removeCertificateSign/useRemoveCertificateSignParameters";
import { createSimpleCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createSimpleCustomProcessor<RemoveCertificateSignParameters>(
  "removeSignatures",
  "removed_signatures_output.pdf",
);

export const removeCertificateSignOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "removeCertSign",
  filePrefix: "removeCertSign_",
});

export const useRemoveCertificateSignOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RemoveCertificateSignParameters>({
    ...removeCertificateSignOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("removeCertSign.error.failed", "An error occurred while removing certificate signatures."),
    ),
  });
};

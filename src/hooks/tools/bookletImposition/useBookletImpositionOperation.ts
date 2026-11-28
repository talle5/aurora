import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { BookletImpositionParameters } from "@app/hooks/tools/bookletImposition/useBookletImpositionParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<BookletImpositionParameters>(
  "booklet",
  "removed_signatures_output.pdf",
  {
    toParams: (p: BookletImpositionParameters) => {
      let pp = {
        border: p.border,
        binding: p.binding,
        addMargim: p.addMargim,
        margim: p.margim,
      };
      const value = Object.entries(pp).reduce((acc, [a, b]) => `${acc}, ${a}:${b}`, "")
        .replaceAll("true", "on")
        .replaceAll("false", "off")
      console.log(value)
      return { pagesPerSheet: p.pagesPerSheet, desc: value }
    }
  }
);


export const bookletImpositionOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "bookletImposition",
  filePrefix: "bookletImposition_",
});

export const useBookletImpositionOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<BookletImpositionParameters>({
    ...bookletImpositionOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("bookletImposition.error.failed", "An error occurred while creating the booklet imposition."),
    ),
  });
};

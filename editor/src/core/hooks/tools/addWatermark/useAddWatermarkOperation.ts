import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { AddWatermarkParameters } from "@app/hooks/tools/addWatermark/useAddWatermarkParameters";
import { createCustomProcessor } from "@app/brain/pdf-cpu";

const customProcessor = createCustomProcessor<AddWatermarkParameters>(
  "addWaterMark",
  "watermark.pdf",
  {
    toParams: (p: AddWatermarkParameters) => {
      const pp = {
        points: p.fontSize,
        rotation: p.rotation,
        opacity: p.opacity / 100,
        // widthSpacer: p.widthSpacer,
        // heightSpacer: p.heightSpacer,
        fontName: p.fontName,
        fillColor: p.fillColor
      }
      const value = Object.entries(pp).reduce((acc, [a, b]) => `${acc}, ${a}:${b}`, "").substring(2);
      console.log(value);
      return { watermarkText: p.watermarkText, desc: value };
    }
  }
);

export const addWatermarkOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "watermark",
  filePrefix: "watermark_",
});

export const useAddWatermarkOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AddWatermarkParameters>({
    ...addWatermarkOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("watermark.error.failed", "An error occurred while adding watermark to the PDF."),
    ),
  });
};

import { BaseParameters } from "@app/types/parameters";
import {
  useBaseParameters,
  BaseParametersHook,
} from "@app/hooks/tools/shared/useBaseParameters";

export interface AddWatermarkParameters extends BaseParameters {
  watermarkType?: "text" | "image";
  watermarkText: string;
  watermarkImage?: File;
  fontSize: number; // Used for both text size and image size
  rotation: number;
  opacity: number;
  widthSpacer: number;
  heightSpacer: number;
  fontName: string;
  fillColor: string;
  convertPDFToImage: boolean;
}

export const defaultParameters: AddWatermarkParameters = {
  watermarkType: undefined,
  watermarkText: "",
  fontSize: 12,
  rotation: 0,
  opacity: 50,
  widthSpacer: 50,
  heightSpacer: 50,
  fontName: "helvica",
  fillColor: "#d3d3d3",
  convertPDFToImage: false,
};

export type AddWatermarkParametersHook =
  BaseParametersHook<AddWatermarkParameters>;

export const useAddWatermarkParameters = (): AddWatermarkParametersHook => {
  return useBaseParameters({
    defaultParameters: defaultParameters,
    endpointName: "add-watermark",
    validateFn: (params): boolean => {
      if (!params.watermarkType) {
        return false;
      }
      if (params.watermarkType === "text") {
        return params.watermarkText.trim().length > 0;
      } else {
        return params.watermarkImage !== undefined;
      }
    },
  });
};

import { BaseParameters } from "@app/types/parameters";
import {
  useBaseParameters,
  BaseParametersHook,
} from "@app/hooks/tools/shared/useBaseParameters";

export interface BookletImpositionParameters extends BaseParameters {
  pagesPerSheet: 2;
  border: boolean;
  binding: "long" | "shot";
  addMargim: boolean;
  margim: number;
  doubleSided: boolean;
  duplexPass: "BOTH" | "FIRST" | "SECOND";
  flipOnShortEdge: boolean;
}

export const defaultParameters: BookletImpositionParameters = {
  pagesPerSheet: 2,
  border: false,
  binding: "long",
  addMargim: false,
  margim: 12,
  doubleSided: true,
  duplexPass: "BOTH",
  flipOnShortEdge: false,
};

export type BookletImpositionParametersHook =
  BaseParametersHook<BookletImpositionParameters>;

export const useBookletImpositionParameters =
  (): BookletImpositionParametersHook => {
    return useBaseParameters({
      defaultParameters,
      endpointName: "booklet-imposition",
      validateFn: (params) => {
        return params.pagesPerSheet === 2;
      },
    });
  };

import { ComponentProps, createEffect, createSignal, on } from "solid-js";
import calculateNodeHeight from "./calculateNodeHeight";
import getSizingData, { SizingData } from "./getSizingData";
import { useWindowResizeListener } from "./hooks";

type TextareaProps = ComponentProps<"textarea">;

type Style = Omit<NonNullable<TextareaProps["style"]>, "max-height" | "min-height"> & {
  height?: number;
};

export type TextareaHeightChangeMeta = {
  rowHeight: number;
};
export interface TextareaAutosizeProps extends Omit<TextareaProps, "style"> {
  maxRows?: number;
  minRows?: number;
  onHeightChange?: (height: number, meta: TextareaHeightChangeMeta) => void;
  cacheMeasurements?: boolean;
  style?: Style;
}

function TextareaAutosize(
  props: {
    cacheMeasurements?: boolean;
    maxRows?: number;
    minRows?: number;
    oninput?: (event: InputEvent) => void;
    ref?: (textarea: HTMLTextAreaElement) => void;
    onHeightChange?: (height: number, { rowHeight }: { rowHeight: number }) => void;
  } & TextareaProps,
) {
  const [textarea, setTextarea] = createSignal<HTMLTextAreaElement>();
  let heightRef = 0;
  let measurementsCacheRef: SizingData | undefined = undefined;

  const resizeTextarea = () => {
    const node = textarea();
    if (!node) return;
    const nodeSizingData =
      props.cacheMeasurements && measurementsCacheRef ? measurementsCacheRef : getSizingData(node);

    if (!nodeSizingData) {
      return;
    }

    measurementsCacheRef = nodeSizingData;

    const [height, rowHeight] = calculateNodeHeight(
      nodeSizingData,
      node.value || node.placeholder || "x",
      props.minRows,
      props.maxRows,
    );

    if (heightRef !== height) {
      heightRef = height;
      node.style.setProperty("height", `${height}px`, "important");
      props.onHeightChange?.(height, { rowHeight });
    }
  };

  const handleChange = (event: InputEvent) => {
    resizeTextarea();
    props.oninput?.(event);
  };

  createEffect(on(() => props.value, resizeTextarea));

  createEffect(() => {
    if (typeof document !== "undefined" && textarea()) {
      resizeTextarea();
      useWindowResizeListener(resizeTextarea);
    }
  });

  return <textarea {...props} oninput={handleChange} ref={(element) => setTextarea(element)} />;
}

export default TextareaAutosize;

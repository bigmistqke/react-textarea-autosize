import { ComponentProps, onMount } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import calculateNodeHeight from './calculateNodeHeight';
import getSizingData, { SizingData } from './getSizingData';
import { useWindowResizeListener } from './hooks';

type TextareaProps = ComponentProps<'textarea'>;

type Style = Omit<
  NonNullable<TextareaProps['style']>,
  'maxHeight' | 'minHeight'
> & {
  height?: number;
};

export type TextareaHeightChangeMeta = {
  rowHeight: number;
};
export interface TextareaAutosizeProps extends Omit<TextareaProps, 'style'> {
  maxRows?: number;
  minRows?: number;
  onHeightChange?: (height: number, meta: TextareaHeightChangeMeta) => void;
  cacheMeasurements?: boolean;
  style?: Style;
}

type Props = {
  cacheMeasurements?: boolean;
  maxRows?: number;
  minRows?: number;
  oninput?: (event: InputEvent) => void;
  ref: (textarea: HTMLTextAreaElement) => void;
  onHeightChange?: (
    height: number,
    { rowHeight }: { rowHeight: number },
  ) => void;
} & TextareaProps;

export default function TextareaAutosize(props: Props) {
  let textarea: HTMLTextAreaElement;
  let heightRef = 0;
  let measurementsCacheRef: SizingData | undefined = undefined;

  const resizeTextarea = () => {
    const node = textarea!;
    const nodeSizingData =
      props.cacheMeasurements && measurementsCacheRef
        ? measurementsCacheRef
        : getSizingData(node);

    if (!nodeSizingData) {
      return;
    }

    measurementsCacheRef = nodeSizingData;

    const [height, rowHeight] = calculateNodeHeight(
      nodeSizingData,
      node.value || node.placeholder || 'x',
      props.minRows,
      props.maxRows,
    );

    if (heightRef !== height) {
      heightRef = height;
      node.style.setProperty('height', `${height}px`, 'important');
      props.onHeightChange?.(height, { rowHeight });
    }
  };

  const handleChange = (event: InputEvent) => {
    resizeTextarea();
    props.oninput?.(event);
  };

  onMount(() => {
    if (typeof document !== 'undefined') {
      resizeTextarea();
      useWindowResizeListener(resizeTextarea);
    }
  });

  return <textarea {...props} oninput={handleChange} ref={textarea!} />;
}

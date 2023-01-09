import { createEffect, createSignal, For } from "solid-js";
import { render } from "solid-js/web";

import TextareaAutosize from "solid-textarea-autosize";

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

const Basic = () => {
  return (
    <div>
      <TextareaAutosize
        maxRows={3}
        style={{
          "line-height": 1,
          "font-size": "10px",
          border: 0,
          "box-sizing": "border-box",
        }}
      />
    </div>
  );
};

const MinMaxRows = () => {
  return (
    <div>
      <h2>{"Component with maxRows and minRows"}</h2>
      <pre>
        {`
  <TextareaAutosize
    minRows={3}
    maxRows={6}
    value="Just a single line..."
    />
`}
      </pre>
      <TextareaAutosize minRows={3} maxRows={6} value="Just a single line..." />
    </div>
  );
};

const MinMaxRowsBorderBox = () => {
  return (
    <div>
      <h2>{"Component with maxRows and minRows (box-sizing: border-box)"}</h2>
      <pre>
        {`
  <TextareaAutosize
    style={{boxSizing: 'border-box'}}
    minRows={3}
    maxRows={6}
    value="Just a single line..."
    />
`}
      </pre>
      <TextareaAutosize
        style={{ boxSizing: "border-box" }}
        minRows={3}
        maxRows={6}
        value="Just a single line..."
      />
    </div>
  );
};

const MaxRows = () => {
  return (
    <div>
      <h2>{"Component with maxRows"}</h2>
      <pre>
        {`
  <TextareaAutosize
    maxRows={5}
    value="Just a single line..."
    />
`}
      </pre>
      <TextareaAutosize maxRows={5} value="Just a single line..." />
    </div>
  );
};

const SetRows = () => {
  return (
    <div>
      <h2>{"Component with rows set"}</h2>
      <pre>
        {`
  <TextareaAutosize
    rows={4}
    value="Just a single line..."
    />
`}
      </pre>
      <TextareaAutosize rows={4} value="Just a single line..." />
    </div>
  );
};

const OnHeightChangeCallback = () => {
  return (
    <div>
      <h2>{"Receive message on height change."}</h2>
      <pre>
        {`
  <TextareaAutosize
    cacheMeasurements
    onHeightChange={(height) => console.log(height)}
    />
`}
      </pre>
      <TextareaAutosize
        cacheMeasurements
        onHeightChange={(height) => {
          // eslint-disable-next-line no-console
          console.log(height);
        }}
      />
    </div>
  );
};

function TextareaAutosize2(
  props: {
    cacheMeasurements?: boolean;
    maxRows?: number;
    minRows?: number;
    oninput?: (event: InputEvent) => void;
    ref?: (textarea: HTMLTextAreaElement) => void;
    onHeightChange?: (height: number, { rowHeight }: { rowHeight: number }) => void;
  } & TextareaProps,
) {
  createEffect(() => console.log("TextareaAutosize", JSON.stringify(props)));
  /* 

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
  }); */

  return <textarea {...props} oninput={props.oninput} />;
}

const MultipleTextareas = () => {
  const [value, setValue] = createSignal("");
  createEffect(() => console.log("value changed", value()));
  console.log(TextareaAutosize);
  return (
    <div>
      <h2>{"Multiple textareas updated at the same time."}</h2>
      <div>{"This one controls the rest."}</div>
      <TextareaAutosize
        value={value()}
        oninput={(ev) => setValue((ev.target as HTMLTextAreaElement).value)}
      />
      <div>{"Those get controlled by the one above."}</div>
      <TextareaAutosize2 value={value()} />
      {/* <For each={Array(15).fill("")}>{() => <TextareaAutosize value={value()} />}</For> */}
    </div>
  );
};

const Demo = () => {
  return (
    <div>
      {/* <Basic />
      <MinMaxRows />
      <MinMaxRowsBorderBox />
      <MaxRows />
      <SetRows />
      <OnHeightChangeCallback /> */}
      <MultipleTextareas />
    </div>
  );
};

render(() => <Demo />, document.getElementById("main") as HTMLElement);

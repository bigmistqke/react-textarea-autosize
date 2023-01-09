import { createSignal } from "solid-js";
import { render } from "solid-js/web";

import TextareaAutosize from "../src";

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

const ControlledMode = () => {
  const [value, setValue] = createSignal(new Array(15).join("\nLine."));
  return (
    <div>
      <h2>{"Controlled mode"}</h2>
      <pre>
        {`
  <TextareaAutosize
    cacheMeasurements
    value={value}
    onChange={ev => setValue(ev.target.value)}
    />
`}
      </pre>
      <TextareaAutosize
        cacheMeasurements
        value={value()}
        onChange={(ev) => setValue((ev.target as HTMLTextAreaElement).value)}
      />
      <button onClick={() => setValue("This value was set programatically")}>
        {"Change value programatically"}
      </button>
    </div>
  );
};

const UncontrolledMode = () => {
  return (
    <div>
      <h2>{"Uncontrolled mode"}</h2>
      <pre>
        {`
  <TextareaAutosize
    value={new Array(15).join('\nLine.')}
    />
`}
      </pre>
      <TextareaAutosize value={new Array(15).join("\nLine.")} />
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

const MultipleTextareas = () => {
  const [value, setValue] = createSignal("");
  return (
    <div>
      <h2>{"Multiple textareas updated at the same time."}</h2>
      <div>{"This one controls the rest."}</div>
      <TextareaAutosize
        value={value()}
        onChange={(ev) => setValue((ev.target as HTMLTextAreaElement).value)}
      />
      <div>{"Those get controlled by the one above."}</div>
      {range(15).map((i) => (
        <TextareaAutosize value={value()} />
      ))}
    </div>
  );
};

const Demo = () => {
  return (
    <div>
      <Basic />
      <MinMaxRows />
      <MinMaxRowsBorderBox />
      <MaxRows />
      <SetRows />
      <ControlledMode />
      <UncontrolledMode />
      <OnHeightChangeCallback />
      <MultipleTextareas />
    </div>
  );
};

render(() => <Demo />, document.getElementById("main") as HTMLElement);

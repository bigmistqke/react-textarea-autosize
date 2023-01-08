import { onCleanup } from "solid-js";

export const useWindowResizeListener = (listener: (event: UIEvent) => any) => {
  const handler: typeof listener = (event) => listener(event);

  window.addEventListener("resize", handler);
  onCleanup(() => window.removeEventListener("resize", handler));
};

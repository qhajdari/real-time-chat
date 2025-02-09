import React from "react";
import { BrowserRouter } from "react-router-dom";

import { render as rtlRender } from "@testing-library/react";

export function customRender(ui, extendedRenderOptions = {}) {
  const { ...renderOptions } = extendedRenderOptions;

  const Wrapper = ({ children }) => (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {children}
    </BrowserRouter>
  );
  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// re-export everything
export * from "@testing-library/react";

export { customRender as render };

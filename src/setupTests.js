import '@testing-library/jest-dom';

// Mock ResizeObserver for Recharts in tests
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    // Call callback with a mock size that gives the chart dimensions
    setTimeout(() => {
      this.callback([{
        target: element,
        contentRect: {
          width: 500,
          height: 400,
        },
      }]);
    }, 0);
  }
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

// Mock Radix UI tooltips to work with fireEvent in tests
jest.mock("@radix-ui/react-tooltip", () => {
  const React = require("react");

  const TooltipContext = React.createContext({ open: false, setOpen: () => {} });

  const Provider = ({ children }) => children;

  const Root = ({ children }) => {
    const [open, setOpen] = React.useState(false);
    return React.createElement(
      TooltipContext.Provider,
      { value: { open, setOpen } },
      children
    );
  };

  const Trigger = React.forwardRef(({ children, ...props }, ref) => {
    const { setOpen } = React.useContext(TooltipContext) || { setOpen: () => {} };
    const handleMouseEnter = () => setOpen?.(true);
    const handleMouseLeave = () => setOpen?.(false);
    return React.cloneElement(React.Children.only(children), {
      ref,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseOver: handleMouseEnter,
      onMouseOut: handleMouseLeave,
      ...props,
    });
  });
  Trigger.displayName = "Trigger";

  const Content = React.forwardRef(({ children, ...props }, ref) => {
    const { open } = React.useContext(TooltipContext) || { open: false };
    return open ? React.createElement("div", { ref, ...props }, children) : null;
  });
  Content.displayName = "Content";

  const Portal = ({ children }) => children;

  return { Provider, Root, Trigger, Content, Portal };
});

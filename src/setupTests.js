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

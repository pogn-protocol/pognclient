import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const { componentName = "UnknownComponent" } = this.props;

    // 🔥 Log context-aware error
    console.error(
      `🛑 ErrorBoundary caught an error in <${componentName}>:`,
      error,
      errorInfo
    );

    this.setState({ error, errorInfo });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { componentName = "UnknownComponent" } = this.props;

    if (hasError) {
      return (
        <div
          style={{ border: "1px solid red", padding: "1rem", margin: "1rem 0" }}
        >
          <h2>
            ⚠️ Error in <code>{componentName}</code>
          </h2>
          {error && (
            <p>
              <strong>{error.toString()}</strong>
            </p>
          )}
          {errorInfo && (
            <details style={{ whiteSpace: "pre-wrap" }}>
              {errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

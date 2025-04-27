// src/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const componentStack = this.state.errorInfo?.componentStack?.trim();
      return (
        <div className="p-6 text-red-600">
          <h1 className="text-2xl font-bold">Something went wrong 😿</h1>
          <p className="mt-2 font-mono whitespace-pre-wrap text-sm bg-red-100 p-2 rounded">
            {this.state.error?.message}
          </p>
          {componentStack && (
            <div className="mt-4">
              <p className="font-semibold">Component trace:</p>
              <pre className="text-xs text-gray-800 bg-gray-100 p-2 rounded">
                {componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

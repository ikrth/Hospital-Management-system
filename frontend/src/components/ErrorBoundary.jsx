import React from 'react'
import toast from 'react-hot-toast'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info)
    toast.error('An unexpected error occurred')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p>Please refresh the page or contact support.</p>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

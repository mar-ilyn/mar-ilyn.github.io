import { Component, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

// Si un asset (textura, HDRI) no carga, esa pieza vuelve a su versión lisa y la escena sigue.
export class AssetBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Asset no disponible, se usa la versión simple:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

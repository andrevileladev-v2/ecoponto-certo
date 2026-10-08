import { Suspense } from 'react'
import PontoClient from './PontoClient'

export const instant = false

export default function PontoPage() {
  return (
    <Suspense fallback={null}>
      <PontoClient />
    </Suspense>
  )
}

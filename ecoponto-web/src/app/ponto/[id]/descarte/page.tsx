import { Suspense } from 'react'

import DescarteClient from './DescarteClient'

export default function DescartePage() {
  return (
    <Suspense fallback={null}>
      <DescarteClient />
    </Suspense>
  )
}

import { RecoveryScene } from '@/components/brand/RecoveryScene'

export default function NotFound() {
  return (
    <RecoveryScene
      code="404"
      title="This bean wandered off."
      message="We couldn’t find that page. Head home and pick up where you left off."
    />
  )
}

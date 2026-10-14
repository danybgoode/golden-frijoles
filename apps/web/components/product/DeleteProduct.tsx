'use client'

import { useActionState, useRef, useState } from 'react'
import { Button, Callout } from '@/design-system/primitives'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteProductAction, type DeleteProductState } from '@/app/app/portfolio/actions'

// many-products · S2.1 (D9) — "Delete product", with a typed confirmation, on Setup › CLI (owner-only; off the measured Keys and Connect surfaces).
//
// The kit's ONE confirmation (`ConfirmDialog`) carries the typed field in its `details` slot; the confirm button stays
// disabled until the person has typed the product's name. The server re-checks that (`deleteProductAction`), so the
// disabled button is a courtesy, not the guard. Rendered for owners only, and never for the public demo project.
const INITIAL: DeleteProductState = { error: null }

export function DeleteProduct({ slug, purgeCommand }: { slug: string; purgeCommand: string }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [state, action, pending] = useActionState(deleteProductAction, INITIAL)
  const form = useRef<HTMLFormElement>(null)
  const matches = typed === slug

  const close = () => {
    setOpen(false)
    setTyped('')
  }

  return (
    <>
      <Callout tone="warn">
        <b>Delete this product.</b> It is gone at once: its keys, connector URL and share links stop working.
        Its data is kept for 30 days, then <code>{purgeCommand}</code> removes it for good.
      </Callout>
      <p>
        <Button type="button" variant="secondary" onClick={() => setOpen(true)} data-delete-product-open>
          Delete product
        </Button>
      </p>
      <ConfirmDialog
        open={open}
        verb="Delete"
        noun="product"
        subject={slug}
        consequence="It is gone at once: its keys, connector URL and share links stop working. Its data is kept for 30 days, then it can be purged."
        pending={pending}
        confirmDisabled={!matches}
        onCancel={close}
        onConfirm={() => form.current?.requestSubmit()}
        details={
          <form
            ref={form}
            action={action}
            onSubmit={(event) => {
              if (!matches) event.preventDefault()
            }}
          >
            <input type="hidden" name="slug" value={slug} />
            <label htmlFor="delete-product-confirm">
              Type <b>{slug}</b> to confirm
            </label>
            <input
              id="delete-product-confirm"
              className="ds-input"
              name="confirm"
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            {state.error ? (
              <p role="alert" className="ds-field-error">
                {state.error}
              </p>
            ) : null}
          </form>
        }
      />
    </>
  )
}

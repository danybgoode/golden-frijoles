'use client'

import { useActionState } from 'react'
import { Button, Field } from '@/design-system/primitives'
import { createProductAction, type NewProductState } from '@/app/app/portfolio/actions'
import { NewThingDialog } from './NewThingDialog'

// many-products · S1.5 (D8) — `+ New product`, on the portfolio head and in the product switcher.
//
// The kit's ONE modal shape (`NewThingDialog`) around one field. The slug is the only thing the form sends; who owns
// the product and which workspace it lands in are decided on the server (see `createProductAction`). A refusal comes
// back as the action's state and renders under the field, in the dialog, where the person typed it.
const INITIAL: NewProductState = { error: null }

export function NewProduct() {
  const [state, action, pending] = useActionState(createProductAction, INITIAL)
  return (
    <NewThingDialog
      label="+ New product"
      title="New product"
      lede="A product is one thing you measure. Pick a short name; you connect it next."
    >
      <form action={action} data-new-product>
        <Field
          label="Product name"
          controlId="new-product-slug"
          hint="3–40 lowercase letters, digits and dashes."
          error={state.error}
        >
          {(control) => (
            <input
              {...control}
              className="ds-input"
              name="slug"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={40}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" state={pending ? 'loading' : 'idle'}>
          Create product
        </Button>
      </form>
    </NewThingDialog>
  )
}

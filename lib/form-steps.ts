/**
 * The ordered steps of each tracked form. Shared by the client tracker and the
 * admin funnel so both agree on what "step 3" means.
 */
export type FormDef = { id: string; label: string; steps: { field: string; label: string; optional?: boolean }[] }

export const FORM_DEFS: FormDef[] = [
  {
    id: 'home-lead-form',
    label: 'Main contact form',
    steps: [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'services', label: 'Services wanted' },
      { field: 'message', label: 'Message', optional: true },
      { field: 'consent', label: 'Consent ticked' },
    ],
  },
  {
    id: 'promo-signup',
    label: 'Promo pop-up sign-up',
    steps: [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'consent', label: 'Consent ticked' },
    ],
  },
]

export const formDef = (id: string) => FORM_DEFS.find((f) => f.id === id)

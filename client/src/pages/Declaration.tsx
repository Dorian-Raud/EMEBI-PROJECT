import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './Declaration.css'
import { invoicesRequester, partnersRequester, type Partner } from '../lib/api/requester'
import { useClient } from '../context/ClientContext'

type DeclarationType = 'fiscale' | 'introduction' | 'expedition'

type InvoiceHeaderDraft = {
  invoiceNumber: string
  invoiceDate: string
  regime: string
  natureTransaction: string
  tiersVatNumber: string
  transportMode: string
}

type InvoiceLineDraft = {
  nomenclatureCode: string
  supplementaryUnit: string
  mass: string
  value: string
  provCountryCode: string
  originCountryCode: string
}

type InvoiceLine = InvoiceLineDraft & { id: string }

const REGIMES_INTRO = [
  { value: '11', label: '11 : Achat/vente ferme (excepté commerce direct avec/par des particuliers)' },
  { value: '12', label: '12 : Commerce direct avec/par des particuliers (y compris les ventes à distance)' },
  { value: '21', label: '21 : Retour de biens (hors remplacement)' },
  { value: '22', label: '22 : Remplacement de biens retournés' },
  { value: '23', label: '23 : Remplacement (par ex. sous garantie) de biens non retournés' },
  { value: '31', label: '31 : Mouvements vers/depuis un entrepôt (à l’exclusion des opérations énumérées à la modalité 32)' },
  { value: '32', label: '32 : Livraison pour vente à vue ou à l’essai' },
  { value: '33', label: '33 : Leasing financier (location-vente)' },
  { value: '34', label: '34 : Transactions impliquant un transfert de propriété sans compensation financière (y compris troc)' },
  { value: '41', label: '41 : Opérations en vue d’un travail à façon : biens réexpédiés vers l’État membre d’expédition initial' },
  { value: '42', label: '42 : Opérations en vue d’un travail à façon : biens non réexpédiés vers l’État membre d’expédition initial' },
  { value: '51', label: '51 : Opération après travail à façon. Biens réexpédiés vers l’État membre d’expédition initial' },
  { value: '52', label: '52 : Opération après travail à façon : biens non réexpédiés vers l’État membre d’expédition initial' },
  { value: '65', label: '65 : Transfert de biens sous le régime du perfectionnement actif' },
  { value: '71', label: '71 : Transport de biens vers/depuis un autre État membre après importation d’un pays hors de l’UE' },
  { value: '72', label: '72 : Transport de biens vers/depuis un autre État membre en vue de l’exporter hors de l’UE' },
  { value: '80', label: '80 : Fourniture de matériaux dans le cadre d’un contrat de construction ou de génie civil' },
  { value: '91', label: '91 : Location, prêt et leasing opérationnel pour une durée supérieure à 24 mois' },
  { value: '99', label: '99 : Autres' },
] as const

const NATURES_INTRO = [
  { value: '11', label: '11 : Achat/vente ferme' },
  { value: '21', label: '21 : Retour de biens' },
  { value: '31', label: '31 : Mouvements vers/depuis un entrepôt' },
  { value: '33', label: '33 : Leasing financier (location-vente)' },
  { value: '99', label: '99 : Autres' },
] as const

const TRANSPORT_MODES = [
  { value: '1', label: '1 : Transport maritime' },
  { value: '2', label: '2 : Transport ferroviaire' },
  { value: '3', label: '3 : Transport routier' },
  { value: '4', label: '4 : Transport aérien' },
  { value: '5', label: '5 : Envoi postal' },
  { value: '7', label: '7 : Installations fixes' },
  { value: '8', label: '8 : Navigation intérieure' },
  { value: '9', label: '9 : Propulsion propre' },
] as const

function getDeclarationTitle(t: DeclarationType) {
  if (t === 'introduction') return 'Déclaration d’introduction'
  if (t === 'expedition') return 'Déclaration d’expédition'
  return 'Déclaration fiscale'
}

function deriveCountryCodeFromVat(vat: string) {
  const v = vat.trim().toUpperCase()
  const match = v.match(/^([A-Z]{2})/)
  return match ? match[1] : ''
}

function newId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID() as string
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="FormField">
      <span className="FormFieldLabel">
        {label} {required ? <span className="FormFieldRequired">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function LineFieldCol({
  label,
  required,
  className,
  title,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <label className={`LineFieldCol ${className ?? ''}`} title={title}>
      <span className="LineFieldLabel">
        {label} {required ? <span className="FormFieldRequired">*</span> : null}
      </span>
      {children}
    </label>
  )
}

export default function Declaration() {
  const { selectedCompany } = useClient()
  const params = useParams()
  const type = (params.type as DeclarationType | undefined) ?? 'introduction'
  const companyId = selectedCompany?.id ?? ''

  const isSupported = type === 'fiscale' || type === 'introduction' || type === 'expedition'
  const title = useMemo(() => (isSupported ? getDeclarationTitle(type) : 'Déclaration'), [isSupported, type])

  const [headerDraft, setHeaderDraft] = useState<InvoiceHeaderDraft>({
    invoiceNumber: '',
    invoiceDate: '',
    regime: '',
    natureTransaction: '',
    tiersVatNumber: '',
    transportMode: '',
  })

  const [headerValidated, setHeaderValidated] = useState(false)

  const autoCountryCode = useMemo(
    () => deriveCountryCodeFromVat(headerDraft.tiersVatNumber),
    [headerDraft.tiersVatNumber],
  )

  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [lineDraft, setLineDraft] = useState<InvoiceLineDraft>({
    nomenclatureCode: '',
    supplementaryUnit: '',
    mass: '',
    value: '',
    provCountryCode: '',
    originCountryCode: '',
  })

  const [editLineId, setEditLineId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<InvoiceLineDraft | null>(null)

  const [partners, setPartners] = useState<Partner[]>([])
  const [partnersLoaded, setPartnersLoaded] = useState(false)
  const [tiersQuery, setTiersQuery] = useState('')
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [showTiersSuggestions, setShowTiersSuggestions] = useState(false)
  const tiersBoxRef = useRef<HTMLDivElement | null>(null)

  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const [partnerForm, setPartnerForm] = useState({ name: '', vatNumber: '', isoCode: '' })
  const [partnerError, setPartnerError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const canValidateHeader =
    !!headerDraft.invoiceNumber.trim() &&
    !!headerDraft.regime &&
    !!headerDraft.natureTransaction &&
    !!headerDraft.invoiceDate.trim() &&
    !!selectedPartnerId

  const tiersSuggestions = useMemo(() => {
    const q = tiersQuery.trim().toUpperCase()
    if (!q) return partners.slice(0, 8)
    return partners
      .filter((p) => p.vatNumber.toUpperCase().includes(q) || p.name.toUpperCase().includes(q))
      .slice(0, 8)
  }, [partners, tiersQuery])

  const ensurePartnersLoaded = async () => {
    if (partnersLoaded) return
    const res = await partnersRequester.getAll(companyId)
    if (res.ok && res.data) {
      setPartners(res.data)
    }
    setPartnersLoaded(true)
  }

  useEffect(() => {
    setPartners([])
    setPartnersLoaded(false)
    setSelectedPartnerId(null)
    setTiersQuery('')
    setHeaderDraft((p) => ({ ...p, tiersVatNumber: '' }))
  }, [companyId])

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const el = tiersBoxRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setShowTiersSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    setTiersQuery(headerDraft.tiersVatNumber)
  }, [headerDraft.tiersVatNumber])

  const resetAll = () => {
    setHeaderValidated(false)
    setHeaderDraft({
      invoiceNumber: '',
      invoiceDate: '',
      regime: '',
      natureTransaction: '',
      tiersVatNumber: '',
      transportMode: '',
    })
    setLines([])
    setLineDraft({
      nomenclatureCode: '',
      supplementaryUnit: '',
      mass: '',
      value: '',
      provCountryCode: '',
      originCountryCode: '',
    })
    setEditLineId(null)
    setEditDraft(null)
    setSelectedPartnerId(null)
    setTiersQuery('')
  }

  const cloneInvoice = () => {
    setLines([])
    setLineDraft({
      nomenclatureCode: '',
      supplementaryUnit: '',
      mass: '',
      value: '',
      provCountryCode: autoCountryCode,
      originCountryCode: autoCountryCode,
    })
    setEditLineId(null)
    setEditDraft(null)
  }

  if (!selectedCompany) return null

  return (
    <div className="DeclarationPage">
      <div className="DeclarationTop">
        <div>
          <h1 className="DeclarationTitle">{title}</h1>
          <p>
            Client : <b>{selectedCompany.name}</b>
          </p>
        </div>
      </div>

      {!isSupported ? (
        <div className="DeclarationPanel">Type de déclaration inconnu.</div>
      ) : null}

      {type === 'introduction' ? (
        <>
          <div className="DeclarationPanel">
            <h2 className="DeclarationPanelTitle">Entête de facture</h2>

            <div className="DeclarationFormGrid">
              <Field label="Numéro de facture" required>
                <input
                  value={headerDraft.invoiceNumber}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, invoiceNumber: e.target.value }))}
                  className="FormInput"
                  disabled={headerValidated}
                />
              </Field>

              <Field label="Date de la déclaration" required>
                <input
                  type="date"
                  value={headerDraft.invoiceDate}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, invoiceDate: e.target.value }))}
                  className="FormInput"
                  disabled={headerValidated}
                />
              </Field>

              <Field label="Régime" required>
                <select
                  value={headerDraft.regime}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, regime: e.target.value }))}
                  className="FormInput FormSelect"
                  disabled={headerValidated}
                >
                  <option value="" disabled>
                    Sélectionner…
                  </option>
                  {REGIMES_INTRO.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nature de la transaction" required>
                <select
                  value={headerDraft.natureTransaction}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, natureTransaction: e.target.value }))}
                  className="FormInput FormSelect"
                  disabled={headerValidated}
                >
                  <option value="" disabled>
                    Sélectionner…
                  </option>
                  {NATURES_INTRO.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tiers (N° TVA client)" required>
                <div className="TiersBox" ref={tiersBoxRef}>
                  <div className="TiersInputRow">
                    <input
                      value={tiersQuery}
                      onFocus={async () => {
                        await ensurePartnersLoaded()
                        setShowTiersSuggestions(true)
                      }}
                      onChange={(e) => {
                        const v = e.target.value
                        setTiersQuery(v)
                        setHeaderDraft((p) => ({ ...p, tiersVatNumber: v }))
                        const match = partners.find(
                          (p) => p.vatNumber.toUpperCase() === v.trim().toUpperCase(),
                        )
                        setSelectedPartnerId(match?.id ?? null)
                        setShowTiersSuggestions(true)
                      }}
                      className="FormInput"
                      disabled={headerValidated}
                    />
                    <button
                      type="button"
                      className="IconBtn"
                      disabled={headerValidated}
                      onClick={() => {
                        setPartnerError(null)
                        const vat = tiersQuery.trim()
                        const inferred = deriveCountryCodeFromVat(vat)
                        setPartnerForm({
                          name: '',
                          vatNumber: vat,
                          isoCode: inferred,
                        })
                        setShowPartnerModal(true)
                      }}
                      title="Créer un tiers"
                    >
                      +
                    </button>
                  </div>

                  {showTiersSuggestions && !headerValidated ? (
                    <div className="TiersSuggestions" role="listbox">
                      {tiersSuggestions.length ? (
                        tiersSuggestions.map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            className="TiersSuggestion"
                            onClick={() => {
                              setHeaderDraft((prev) => ({ ...prev, tiersVatNumber: p.vatNumber }))
                              setTiersQuery(p.vatNumber)
                              setSelectedPartnerId(p.id)
                              setShowTiersSuggestions(false)
                            }}
                          >
                            <div className="TiersSuggestionTop">
                              <span className="TiersSuggestionVat">{p.vatNumber}</span>
                              <span className="TiersSuggestionIso">{p.isoCode}</span>
                            </div>
                            <div className="TiersSuggestionName">{p.name}</div>
                          </button>
                        ))
                      ) : (
                        <div className="TiersSuggestionEmpty">
                          Aucune proposition. Clique sur <b>+</b> pour créer le tiers.
                        </div>
                      )}
                    </div>
                  ) : null}
                  {!headerValidated && tiersQuery.trim() && !selectedPartnerId ? (
                    <p className="TiersHintError">
                      Sélectionne un tiers existant dans la liste ou crée-le avec <b>+</b>.
                    </p>
                  ) : null}
                </div>
              </Field>

              <Field label="Mode de transport">
                <select
                  value={headerDraft.transportMode}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, transportMode: e.target.value }))}
                  className="FormInput FormSelect"
                  disabled={headerValidated}
                >
                  <option value="">Sélectionner…</option>
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="DeclarationActions">
              {!headerValidated ? (
                <button
                  type="button"
                  className="BtnPrimary"
                  disabled={!canValidateHeader}
                  onClick={() => {
                    setHeaderValidated(true)
                    const inferred = autoCountryCode
                    setLineDraft((p) => ({
                      ...p,
                      provCountryCode: p.provCountryCode || inferred,
                      originCountryCode: p.originCountryCode || inferred,
                    }))
                  }}
                >
                  Valider l’entête
                </button>
              ) : (
                <button
                  type="button"
                  className="BtnSecondary"
                  onClick={() => setHeaderValidated(false)}
                >
                  Modifier l’entête
                </button>
              )}
            </div>
          </div>

          <div className={`DeclarationPanel ${headerValidated ? '' : 'DeclarationPanelDisabled'}`}>
            <h2 className="DeclarationPanelTitle">Lignes de facture</h2>
            <div className="LineEntryScroll">
              <div className="LineEntryGrid">
                <LineFieldCol label="Nomenclature" required className="LineFieldColNc">
                  <input
                    value={lineDraft.nomenclatureCode}
                    onChange={(e) => setLineDraft((p) => ({ ...p, nomenclatureCode: e.target.value }))}
                    className="FormInput"
                    disabled={!headerValidated}
                  />
                </LineFieldCol>
                <LineFieldCol label="Provenance" required className="LineFieldColCtry" title="Pays de provenance">
                  <input
                    value={lineDraft.provCountryCode}
                    onChange={(e) => setLineDraft((p) => ({ ...p, provCountryCode: e.target.value.toUpperCase() }))}
                    className="FormInput"
                    placeholder={autoCountryCode}
                    disabled={!headerValidated}
                  />
                </LineFieldCol>
                <LineFieldCol label="Origine" required className="LineFieldColCtry" title="Pays d’origine">
                  <input
                    value={lineDraft.originCountryCode}
                    onChange={(e) => setLineDraft((p) => ({ ...p, originCountryCode: e.target.value.toUpperCase() }))}
                    className="FormInput"
                    placeholder={autoCountryCode}
                    disabled={!headerValidated}
                  />
                </LineFieldCol>
                <LineFieldCol label="Quantité" className="LineFieldColSmall">
                  <input
                    value={lineDraft.supplementaryUnit}
                    onChange={(e) => setLineDraft((p) => ({ ...p, supplementaryUnit: e.target.value }))}
                    className="FormInput"
                    disabled={!headerValidated}
                  />
                </LineFieldCol>
                <LineFieldCol label="Poids (kg)" required className="LineFieldColSmall">
                  <input
                    value={lineDraft.mass}
                    onChange={(e) => setLineDraft((p) => ({ ...p, mass: e.target.value }))}
                    className="FormInput"
                    placeholder="Min 1kg"
                    disabled={!headerValidated}
                  />
                </LineFieldCol>
                <LineFieldCol label="Valeur (€)" required className="LineFieldColSmall">
                  <input
                    value={lineDraft.value}
                    onChange={(e) => setLineDraft((p) => ({ ...p, value: e.target.value }))}
                    className="FormInput"
                    disabled={!headerValidated}
                  />
                </LineFieldCol>
                <div className="LineFieldCol LineFieldColAction">
                  <span className="LineFieldLabel LineFieldLabelInvisible">Action</span>
                  <button
                    type="button"
                    className="BtnPrimary LineAddBtn"
                    disabled={
                      !headerValidated ||
                      !lineDraft.nomenclatureCode.trim() ||
                      !lineDraft.mass.trim() ||
                      !lineDraft.value.trim() ||
                      !lineDraft.provCountryCode.trim() ||
                      !lineDraft.originCountryCode.trim()
                    }
                    onClick={() => {
                      setLines((prev) => [...prev, { ...lineDraft, id: newId() }])
                      setLineDraft((p) => ({
                        ...p,
                        nomenclatureCode: '',
                        supplementaryUnit: '',
                        mass: '',
                        value: '',
                        provCountryCode: autoCountryCode,
                        originCountryCode: autoCountryCode,
                      }))
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {lines.length ? (
              <div className="LinesList">
                {lines.map((l) => (
                  <div key={l.id} className="LineRowFull">
                    {editLineId === l.id && editDraft ? (
                      <>
                        <div className="LineEntryScroll">
                          <div className="LineEntryGrid LineEntryGridInRow">
                            <LineFieldCol label="Nomenclature" required className="LineFieldColNc">
                              <input
                                value={editDraft.nomenclatureCode}
                                onChange={(e) =>
                                  setEditDraft((p) => (p ? { ...p, nomenclatureCode: e.target.value } : p))
                                }
                                className="FormInput"
                              />
                            </LineFieldCol>
                            <LineFieldCol label="Provenance" required className="LineFieldColCtry" title="Pays de provenance">
                              <input
                                value={editDraft.provCountryCode}
                                onChange={(e) =>
                                  setEditDraft((p) =>
                                    p ? { ...p, provCountryCode: e.target.value.toUpperCase() } : p,
                                  )
                                }
                                className="FormInput"
                              />
                            </LineFieldCol>
                            <LineFieldCol label="Origine" required className="LineFieldColCtry" title="Pays d’origine">
                              <input
                                value={editDraft.originCountryCode}
                                onChange={(e) =>
                                  setEditDraft((p) =>
                                    p ? { ...p, originCountryCode: e.target.value.toUpperCase() } : p,
                                  )
                                }
                                className="FormInput"
                              />
                            </LineFieldCol>
                            <LineFieldCol label="Quantité" className="LineFieldColSmall">
                              <input
                                value={editDraft.supplementaryUnit}
                                onChange={(e) =>
                                  setEditDraft((p) => (p ? { ...p, supplementaryUnit: e.target.value } : p))
                                }
                                className="FormInput"
                              />
                            </LineFieldCol>
                            <LineFieldCol label="Poids (kg)" required className="LineFieldColSmall">
                              <input
                                value={editDraft.mass}
                                onChange={(e) => setEditDraft((p) => (p ? { ...p, mass: e.target.value } : p))}
                                className="FormInput"
                              />
                            </LineFieldCol>
                            <LineFieldCol label="Valeur (€)" required className="LineFieldColSmall">
                              <input
                                value={editDraft.value}
                                onChange={(e) => setEditDraft((p) => (p ? { ...p, value: e.target.value } : p))}
                                className="FormInput"
                              />
                            </LineFieldCol>
                          </div>
                        </div>
                        <div className="LineRowBtns">
                          <button
                            type="button"
                            className="BtnPrimary"
                            onClick={() => {
                              const d = editDraft
                              setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, ...d } : x)))
                              setEditLineId(null)
                              setEditDraft(null)
                            }}
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            className="BtnSecondary"
                            onClick={() => {
                              setEditLineId(null)
                              setEditDraft(null)
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="LineRowFullDisplay">
                        <div className="LineRowDisplay">
                          <div className="LineRowMain">
                            <b>NC</b> {l.nomenclatureCode} · <b>Prov</b> {l.provCountryCode} · <b>Orig</b>{' '}
                            {l.originCountryCode} · <b>Qté</b> {l.supplementaryUnit || '—'} · <b>Poids</b> {l.mass} ·{' '}
                            <b>Valeur</b> {l.value}
                          </div>
                        </div>
                        <div className="LineRowBtns">
                          <button
                            type="button"
                            className="BtnSecondary"
                            disabled={!headerValidated}
                            onClick={() => {
                              setEditLineId(l.id)
                              setEditDraft({
                                nomenclatureCode: l.nomenclatureCode,
                                supplementaryUnit: l.supplementaryUnit,
                                mass: l.mass,
                                value: l.value,
                                provCountryCode: l.provCountryCode,
                                originCountryCode: l.originCountryCode,
                              })
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="BtnSecondary"
                            disabled={!headerValidated}
                            onClick={() => setLines((prev) => prev.filter((x) => x.id !== l.id))}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="LinesEmpty">Aucune ligne pour le moment.</div>
            )}

            {saveError ? <p className="DeclarationSaveError">{saveError}</p> : null}

            <div className="DeclarationActions DeclarationActionsEnd">
              <button
                type="button"
                className="BtnPrimary"
                disabled={!headerValidated || lines.length === 0 || saving}
                onClick={async () => {
                  if (!selectedPartnerId || !companyId) return
                  setSaveError(null)
                  setSaving(true)

                  const d = headerDraft.invoiceDate ? new Date(headerDraft.invoiceDate) : new Date()
                  const payload = {
                    companyId,
                    flow: 'INTRODUCTION' as const,
                    month: d.getMonth() + 1,
                    year: d.getFullYear(),
                    invoiceNumber: headerDraft.invoiceNumber.trim(),
                    invoiceDate: headerDraft.invoiceDate || null,
                    regime: headerDraft.regime,
                    transactionNature: headerDraft.natureTransaction,
                    transportMode: headerDraft.transportMode || null,
                    partnerId: selectedPartnerId,
                    lines: lines.map((l, i) => ({
                      lineNumber: i + 1,
                      nomenclatureCode: l.nomenclatureCode.trim(),
                      mass: Number(l.mass),
                      supplementaryUnit: l.supplementaryUnit
                        ? Number(l.supplementaryUnit)
                        : null,
                      value: Number(l.value),
                      originCountryCode: l.originCountryCode.trim().toUpperCase(),
                      provCountryCode: l.provCountryCode.trim().toUpperCase(),
                    })),
                  }

                  const res = await invoicesRequester.create(payload)
                  setSaving(false)
                  if (!res.ok) {
                    setSaveError('Enregistrement impossible. Vérifie les champs et réessaie.')
                    return
                  }
                  resetAll()
                }}
              >
                {saving ? 'Enregistrement…' : 'Valider facture'}
              </button>
              <button
                type="button"
                className="BtnSecondary"
                disabled={!headerValidated}
                onClick={cloneInvoice}
              >
                Cloner facture
              </button>
            </div>
          </div>

          {showPartnerModal ? (
            <div className="ModalOverlay" role="dialog" aria-modal="true">
              <div className="Modal">
                <div className="ModalHeader">
                  <div className="ModalTitle">Créer un tiers</div>
                  <button type="button" className="IconBtn" onClick={() => setShowPartnerModal(false)}>
                    ×
                  </button>
                </div>

                {partnerError ? <div className="ModalError">{partnerError}</div> : null}

                <div className="ModalBody">
                  <p className="DeclarationSmallHint">
                    Ce tiers sera rattaché au client <b>{selectedCompany.name}</b>.
                  </p>
                  <label className="FormField">
                    <span className="FormFieldLabel">
                      Nom <span className="FormFieldRequired">*</span>
                    </span>
                    <input
                      className="FormInput"
                      value={partnerForm.name}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: Client ABC"
                    />
                  </label>
                  <label className="FormField">
                    <span className="FormFieldLabel">
                      N° TVA <span className="FormFieldRequired">*</span>
                    </span>
                    <input
                      className="FormInput"
                      value={partnerForm.vatNumber}
                      onChange={(e) =>
                        setPartnerForm((p) => ({
                          ...p,
                          vatNumber: e.target.value,
                          isoCode: p.isoCode || deriveCountryCodeFromVat(e.target.value),
                        }))
                      }
                      placeholder="Ex: BE0123456789"
                    />
                  </label>
                  <label className="FormField">
                    <span className="FormFieldLabel">
                      Pays (ISO) <span className="FormFieldRequired">*</span>
                    </span>
                    <input
                      className="FormInput"
                      value={partnerForm.isoCode}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, isoCode: e.target.value.toUpperCase() }))}
                      placeholder="Ex: BE"
                    />
                  </label>
                </div>

                <div className="ModalFooter">
                  <button type="button" className="BtnSecondary" onClick={() => setShowPartnerModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="BtnPrimary"
                    disabled={
                      !partnerForm.name.trim() ||
                      !partnerForm.vatNumber.trim() ||
                      !partnerForm.isoCode.trim()
                    }
                    onClick={async () => {
                      setPartnerError(null)
                      const res = await partnersRequester.create({
                        name: partnerForm.name.trim(),
                        vatNumber: partnerForm.vatNumber.trim(),
                        isoCode: partnerForm.isoCode.trim().toUpperCase(),
                        companyId,
                      })
                      if (!res.ok) {
                        // On log l'erreur détaillée en console, mais on affiche une erreur générique à l'utilisateur
                        // eslint-disable-next-line no-console
                        console.error("Erreur création tiers:", res)
                        setPartnerError("Impossible de créer le tiers (erreur serveur ou connexion).")
                        return
                      }
                      if (res.data) {
                        const created = res.data as Partner
                        setPartners((prev) => [created, ...prev])
                        setHeaderDraft((prev) => ({ ...prev, tiersVatNumber: created.vatNumber }))
                        setTiersQuery(created.vatNumber)
                        setSelectedPartnerId(created.id)
                      }
                      setShowPartnerModal(false)
                      setShowTiersSuggestions(false)
                    }}
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="DeclarationPanel">
          <h2 style={{ marginBottom: 8 }}>À venir</h2>
          <p>
            Le formulaire pour <b>{getDeclarationTitle(type)}</b> sera ajouté ensuite (même page, affichage conditionnel).
          </p>
        </div>
      )}
    </div>
  )
}


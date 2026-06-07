import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import './Declaration.css'
import { invoicesRequester, partnersRequester } from '../lib/api/requester'
import type { Partner, DeclarationType, InvoiceHeaderDraft, InvoiceLineDraft, InvoiceLine } from '../types'
import { useClient } from '../context/ClientContext'
import { NATURES_INTRO, REGIMES_INTRO, TRANSPORT_MODES } from '../constants/declaration'
import { Field, LineFieldCol } from '../components/FormField'
import { PartnerModal } from '../components/PartnerModal'
import { InvoiceLineRow } from '../components/InvoiceLineRow'

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

export default function Declaration() {
  const { selectedCompany } = useClient()
  const params = useParams()
  const type = (params.type as DeclarationType | undefined) ?? 'introduction'
  const companyId = selectedCompany?.id ?? ''

  const isSupported = type === 'fiscale' || type === 'introduction' || type === 'expedition'
  const title = useMemo(() => (isSupported ? getDeclarationTitle(type) : 'Déclaration'), [isSupported, type])

  // ── Header ──────────────────────────────────────────────────────────────────
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

  // ── Lignes ───────────────────────────────────────────────────────────────────
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [lineDraft, setLineDraft] = useState<InvoiceLineDraft>({
    nomenclatureCode: '',
    supplementaryUnit: '',
    mass: '',
    value: '',
    provCountryCode: '',
    originCountryCode: '',
  })

  // ── Tiers ────────────────────────────────────────────────────────────────────
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnersLoaded, setPartnersLoaded] = useState(false)
  const [tiersQuery, setTiersQuery] = useState('')
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [showTiersSuggestions, setShowTiersSuggestions] = useState(false)
  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const tiersBoxRef = useRef<HTMLDivElement | null>(null)

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Computed ─────────────────────────────────────────────────────────────────
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

  // ── Effects ──────────────────────────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const ensurePartnersLoaded = async () => {
    if (partnersLoaded) return
    const res = await partnersRequester.getAll(companyId)
    if (res.ok && res.data) setPartners(res.data)
    setPartnersLoaded(true)
  }

  const resetAll = () => {
    setHeaderValidated(false)
    setHeaderDraft({ invoiceNumber: '', invoiceDate: '', regime: '', natureTransaction: '', tiersVatNumber: '', transportMode: '' })
    setLines([])
    setLineDraft({ nomenclatureCode: '', supplementaryUnit: '', mass: '', value: '', provCountryCode: '', originCountryCode: '' })
    setSelectedPartnerId(null)
    setTiersQuery('')
    setSaveError(null)
    setSaveSuccess(null)
  }

  const cloneInvoice = () => {
    setLines([])
    setLineDraft({ nomenclatureCode: '', supplementaryUnit: '', mass: '', value: '', provCountryCode: autoCountryCode, originCountryCode: autoCountryCode })
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
                      onClick={() => setShowPartnerModal(true)}
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
                  <InvoiceLineRow
                    key={l.id}
                    line={l}
                    disabled={!headerValidated}
                    onSave={(id, draft) => setLines((prev) => prev.map((x) => x.id === id ? { ...x, ...draft } : x))}
                    onDelete={(id) => setLines((prev) => prev.filter((x) => x.id !== id))}
                  />
                ))}
              </div>
            ) : (
              <div className="LinesEmpty">Aucune ligne pour le moment.</div>
            )}

            {saveError ? <p className="DeclarationSaveError">{saveError}</p> : null}
            {saveSuccess ? <p className="DeclarationSaveSuccess">{saveSuccess}</p> : null}

            <div className="DeclarationActions DeclarationActionsEnd">
              <button
                type="button"
                className="BtnPrimary"
                disabled={!headerValidated || lines.length === 0 || saving}
                onClick={async () => {
                  if (!selectedPartnerId || !companyId) return
                  setSaveError(null)
                  setSaveSuccess(null)
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
                    if (res.status === 409) {
                      setSaveError(`La facture n°${headerDraft.invoiceNumber.trim()} existe déjà pour ce fournisseur sur cette période.`)
                    } else if (res.status === 400) {
                      setSaveError('Certains champs sont manquants ou invalides.')
                    } else {
                      setSaveError('Enregistrement impossible. Une erreur serveur est survenue.')
                    }
                    return
                  }

                  setSaveSuccess(`Facture n°${headerDraft.invoiceNumber.trim()} enregistrée avec succès.`)
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
            <PartnerModal
              companyId={companyId}
              companyName={selectedCompany.name}
              initialVatNumber={tiersQuery.trim()}
              onClose={() => setShowPartnerModal(false)}
              onCreated={(created) => {
                setPartners((prev) => [created, ...prev])
                setHeaderDraft((prev) => ({ ...prev, tiersVatNumber: created.vatNumber }))
                setTiersQuery(created.vatNumber)
                setSelectedPartnerId(created.id)
                setShowTiersSuggestions(false)
              }}
            />
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


import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import './Declaration.css'
import { invoicesRequester } from '../lib/api/requester'
import type { DeclarationType, InvoiceHeaderDraft, InvoiceLineDraft, InvoiceLine } from '../types'
import { useClient } from '../context/ClientContext'
import { NATURES, REGIMES_INTRO, REGIMES_EXPEDITION, TRANSPORT_MODES } from '../constants/declaration'
import { Field } from '../components/FormField'
import { PartnerModal } from '../components/PartnerModal'
import { InvoiceLineRow } from '../components/InvoiceLineRow'
import { InvoiceLineForm } from '../components/InvoiceLineForm'
import { usePartners } from '../hooks/usePartners'

function getDeclarationTitle(t: DeclarationType) {
  if (t === 'introduction') return 'Déclaration d’introduction'
  return 'Déclaration d’expédition'
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

  const isSupported = type === 'introduction' || type === 'expedition'
  const title = useMemo(() => (isSupported ? getDeclarationTitle(type) : 'Déclaration'), [isSupported, type])

  // ── Header ──────────────────────────────────────────────────────────────────
  const [headerDraft, setHeaderDraft] = useState<InvoiceHeaderDraft>({
    invoiceNumber: '', invoiceDate: '', regime: '', natureTransaction: '', tiersVatNumber: '', transportMode: '',
  })
  const [headerValidated, setHeaderValidated] = useState(false)

  const autoCountryCode = useMemo(
    () => deriveCountryCodeFromVat(headerDraft.tiersVatNumber),
    [headerDraft.tiersVatNumber],
  )
  const regimes = type === 'expedition' ? REGIMES_EXPEDITION : REGIMES_INTRO
  const flow = type === 'expedition' ? 'EXPEDITION' as const : 'INTRODUCTION' as const

  // ── Lignes ───────────────────────────────────────────────────────────────────
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [lineDraft, setLineDraft] = useState<InvoiceLineDraft>({
    nomenclatureCode: '', supplementaryUnit: '', mass: '', value: '', provCountryCode: '', originCountryCode: '',
  })

  // ── Tiers ────────────────────────────────────────────────────────────────────
  const {
    partners,
    tiersQuery,
    setTiersQuery,
    selectedPartnerId,
    setSelectedPartnerId,
    showTiersSuggestions,
    setShowTiersSuggestions,
    tiersBoxRef,
    tiersSuggestions,
    ensurePartnersLoaded,
    selectPartner,
    addPartner,
    resetPartners,
  } = usePartners(companyId)

  // ── Modale tiers ─────────────────────────────────────────────────────────────
  const [showPartnerModal, setShowPartnerModal] = useState(false)

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

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setHeaderValidated(false)
    setHeaderDraft({ invoiceNumber: '', invoiceDate: '', regime: '', natureTransaction: '', tiersVatNumber: '', transportMode: '' })
    setLines([])
    setLineDraft({ nomenclatureCode: '', supplementaryUnit: '', mass: '', value: '', provCountryCode: '', originCountryCode: '' })
    resetPartners()
    setSaveError(null)
    setSaveSuccess(null)
  }

  const submitInvoice = async () => {
    if (!selectedPartnerId || !companyId) return false
    setSaveError(null)
    setSaveSuccess(null)
    setSaving(true)

    const d = headerDraft.invoiceDate ? new Date(headerDraft.invoiceDate) : new Date()

    const payload = {
      companyId,
      flow,
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
        supplementaryUnit: l.supplementaryUnit ? Number(l.supplementaryUnit) : null,
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
      return false
    }

    return true
  }

  if (!selectedCompany) return null

  return (
    <div className="DeclarationPage">
      <div className="DeclarationTop">
        <div>
          <h1 className="DeclarationTitle">{title}</h1>
          <p>Client : <b>{selectedCompany.name}</b></p>
        </div>
      </div>

      {!isSupported ? <div className="DeclarationPanel">Type de déclaration inconnu.</div> : null}

      {isSupported ? (
        <>
          <div className="DeclarationPanel">
            <h2 className="DeclarationPanelTitle">Entête de facture</h2>
            <div className="DeclarationFormGrid">
              <Field label="Numéro de facture" required>
                <input value={headerDraft.invoiceNumber} onChange={(e) => setHeaderDraft((p) => ({ ...p, invoiceNumber: e.target.value }))} className="FormInput" disabled={headerValidated} />
              </Field>
              <Field label="Date de la déclaration" required>
                <input type="date" value={headerDraft.invoiceDate} onChange={(e) => setHeaderDraft((p) => ({ ...p, invoiceDate: e.target.value }))} className="FormInput" disabled={headerValidated} />
              </Field>
              <Field label="Régime" required>
                <select value={headerDraft.regime} onChange={(e) => setHeaderDraft((p) => ({ ...p, regime: e.target.value }))} className="FormInput FormSelect" disabled={headerValidated}>
                  <option value="" disabled>Sélectionner…</option>
                  {regimes.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Nature de la transaction" required>
                <select value={headerDraft.natureTransaction} onChange={(e) => setHeaderDraft((p) => ({ ...p, natureTransaction: e.target.value }))} className="FormInput FormSelect" disabled={headerValidated}>
                  <option value="" disabled>Sélectionner…</option>
                  {NATURES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </Field>
              <Field label="Tiers (N° TVA client)" required>
                <div className="TiersBox" ref={tiersBoxRef}>
                  <div className="TiersInputRow">
                    <input
                      value={tiersQuery}
                      onFocus={async () => { await ensurePartnersLoaded(); setShowTiersSuggestions(true) }}
                      onChange={(e) => {
                        const v = e.target.value
                        setTiersQuery(v)
                        setHeaderDraft((p) => ({ ...p, tiersVatNumber: v }))
                        const match = partners.find((p) => p.vatNumber.toUpperCase() === v.trim().toUpperCase())
                        setSelectedPartnerId(match?.id ?? null)
                        setShowTiersSuggestions(true)
                      }}
                      className="FormInput"
                      disabled={headerValidated}
                    />
                    <button type="button" className="IconBtn" disabled={headerValidated} onClick={() => setShowPartnerModal(true)} title="Créer un tiers">+</button>
                  </div>
                  {showTiersSuggestions && !headerValidated ? (
                    <div className="TiersSuggestions" role="listbox">
                      {tiersSuggestions.length ? tiersSuggestions.map((p) => (
                        <button type="button" key={p.id} className="TiersSuggestion" onClick={() => {
                          setHeaderDraft((prev) => ({ ...prev, tiersVatNumber: p.vatNumber }))
                          selectPartner(p)
                        }}>
                          <div className="TiersSuggestionTop">
                            <span className="TiersSuggestionVat">{p.vatNumber}</span>
                            <span className="TiersSuggestionIso">{p.isoCode}</span>
                          </div>
                          <div className="TiersSuggestionName">{p.name}</div>
                        </button>
                      )) : (
                        <div className="TiersSuggestionEmpty">Aucune proposition. Clique sur <b>+</b> pour créer le tiers.</div>
                      )}
                    </div>
                  ) : null}
                  {!headerValidated && tiersQuery.trim() && !selectedPartnerId ? (
                    <p className="TiersHintError">Sélectionne un tiers existant dans la liste ou crée-le avec <b>+</b>.</p>
                  ) : null}
                </div>
              </Field>
              <Field label="Mode de transport">
                <select value={headerDraft.transportMode} onChange={(e) => setHeaderDraft((p) => ({ ...p, transportMode: e.target.value }))} className="FormInput FormSelect" disabled={headerValidated}>
                  <option value="">Sélectionner…</option>
                  {TRANSPORT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="DeclarationActions">
              {!headerValidated ? (
                <button type="button" className="BtnPrimary" disabled={!canValidateHeader} onClick={() => {
                  setHeaderValidated(true)
                  setLineDraft((p) => ({
                    ...p,
                    provCountryCode: p.provCountryCode || autoCountryCode,
                    originCountryCode: p.originCountryCode || autoCountryCode,
                  }))
                }}>
                  Valider l'entête
                </button>
              ) : (
                <button type="button" className="BtnSecondary" onClick={() => setHeaderValidated(false)}>
                  Modifier l'entête
                </button>
              )}
            </div>
          </div>

          <div className={`DeclarationPanel ${headerValidated ? '' : 'DeclarationPanelDisabled'}`}>
            <h2 className="DeclarationPanelTitle">Lignes de facture</h2>

            <InvoiceLineForm
              draft={lineDraft}
              autoCountryCode={autoCountryCode}
              disabled={!headerValidated}
              onChange={setLineDraft}
              onAdd={() => {
                setLines((prev) => [...prev, { ...lineDraft, id: newId() }])
                setLineDraft({
                  nomenclatureCode: '', supplementaryUnit: '', mass: '', value: '',
                  provCountryCode: autoCountryCode, originCountryCode: autoCountryCode,
                })
              }}
            />

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
                  const ok = await submitInvoice()
                  if (!ok) return
                  setSaveSuccess(`Facture n°${headerDraft.invoiceNumber.trim()} enregistrée avec succès.`)
                  resetAll()
                }}
              >
                {saving ? 'Enregistrement…' : 'Valider facture'}
              </button>
              <button
                type="button"
                className="BtnSecondary"
                disabled={!headerValidated || lines.length === 0 || saving}
                onClick={async () => {
                  const ok = await submitInvoice()
                  if (!ok) return
                  setSaveSuccess(`Facture n°${headerDraft.invoiceNumber.trim()} enregistrée avec succès.`)
                  setLines([])
                  setLineDraft({
                    nomenclatureCode: '', supplementaryUnit: '', mass: '', value: '',
                    provCountryCode: autoCountryCode, originCountryCode: autoCountryCode,
                  })
                  setHeaderDraft((p) => ({ ...p, invoiceNumber: '' }))
                  setHeaderValidated(false)
                }}
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
                addPartner(created)
                setHeaderDraft((prev) => ({ ...prev, tiersVatNumber: created.vatNumber }))
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
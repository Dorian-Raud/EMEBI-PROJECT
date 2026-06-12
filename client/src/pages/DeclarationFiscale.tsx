import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import { usePartners } from '../hooks/usePartners'
import { declarationsFiscalesRequester } from '../lib/api/requester'
import { REGIMES_FISCALE } from '../constants/declaration'
import { Field } from '../components/FormField'
import { PartnerModal } from '../components/PartnerModal'

export default function DeclarationFiscale() {
  const { selectedCompany } = useClient()
  const companyId = selectedCompany?.id ?? ''
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get('editId')

  const [form, setForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    regime: '',
    value: '',
  })

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
  } = usePartners(companyId)

  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Chargement en mode édition ────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return
    declarationsFiscalesRequester.getById(editId).then((res) => {
      if (!res.ok || !res.data) return
      const d = res.data
      const dateStr = d.invoiceDate ? d.invoiceDate.split('T')[0] : ''
      setForm({
        invoiceNumber: d.invoiceNumber ?? '',
        invoiceDate: dateStr,
        regime: d.regime ?? '',
        value: String(d.value ?? ''),
      })
      setSelectedPartnerId(d.partner?.id ?? null)
      setTiersQuery(d.partner?.vatNumber ?? '')
    })
  }, [editId])

  const canSubmit = 
    !!form.invoiceNumber.trim() && 
    !!form.invoiceDate && 
    !!form.regime && 
    !!form.value.trim() && 
    !!selectedPartnerId

  // 1. Fonction centrale d'envoi à l'API (partagée par les deux boutons)
  const executeSave = async () => {
    if (!canSubmit) return false

    setLoading(true)
    setError(null)
    setSuccess(null)

    let res
    if (editId) {
      res = await declarationsFiscalesRequester.update(editId, {
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceDate: form.invoiceDate || null,
        regime: form.regime,
        value: Number(form.value),
        partnerId: selectedPartnerId!,
      })
    } else {
      const dateObj = new Date(form.invoiceDate)
      res = await declarationsFiscalesRequester.create({
        companyId,
        month: dateObj.getMonth() + 1,
        year: dateObj.getFullYear(),
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceDate: form.invoiceDate,
        regime: form.regime,
        value: Number(form.value),
        partnerId: selectedPartnerId!,
      })
    }

    setLoading(false)
    return res.ok
  }

  if (!selectedCompany) return null

  return (
    <div className="DeclarationPage">
      <div className="DeclarationTop">
        <div>
          <h1 className="DeclarationTitle">{editId ? 'Modifier la déclaration fiscale' : 'Déclaration Fiscale'}</h1>
          <p>Client : <b>{selectedCompany.name}</b></p>
        </div>
      </div>

      {/* On empêche le submit natif du formulaire pour gérer nos boutons proprement */}
      <form onSubmit={(e) => e.preventDefault()} className="DeclarationPanel">
        <h2 className="DeclarationPanelTitle">Informations de la déclaration</h2>
        <div className="DeclarationFormGrid">
          <Field label="Numéro de facture" required>
            <input value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} className="FormInput" />
          </Field>

          <Field label="Date de la déclaration" required>
            <input type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} className="FormInput" />
          </Field>

          <Field label="Régime" required>
            <select value={form.regime} onChange={e => setForm(p => ({ ...p, regime: e.target.value }))} className="FormInput FormSelect">
              <option value="" disabled>Sélectionner…</option>
              {REGIMES_FISCALE.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                    const match = partners.find((p) => p.vatNumber.toUpperCase() === v.trim().toUpperCase())
                    setSelectedPartnerId(match?.id ?? null)
                    setShowTiersSuggestions(true)
                  }}
                  className="FormInput"
                />
                <button type="button" className="IconBtn" onClick={() => setShowPartnerModal(true)} title="Créer un tiers">+</button>
              </div>
              {showTiersSuggestions ? (
                <div className="TiersSuggestions" role="listbox">
                  {tiersSuggestions.length ? tiersSuggestions.map((p) => (
                    <button type="button" key={p.id} className="TiersSuggestion" onClick={() => {
                      setTiersQuery(p.vatNumber)
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
              {tiersQuery.trim() && !selectedPartnerId ? (
                <p className="TiersHintError">Sélectionne un tiers existant dans la liste ou crée-le avec <b>+</b>.</p>
              ) : null}
            </div>
          </Field>

          <Field label="Montant Total (€)" required>
            <input type="number" step="0.01" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} className="FormInput" placeholder="0.00" />
          </Field>
        </div>

        {error && <p className="DeclarationSaveError">{error}</p>}
        {success && <p className="DeclarationSaveSuccess">{success}</p>}

        {/* 2. Zone des boutons d'action */}
        <div className="DeclarationActions DeclarationActionsEnd" style={{ marginTop: 24 }}>
          
          {/* BOUTON STANDARD */}
          <button
            type="button"
            className="BtnPrimary"
            disabled={!canSubmit || loading}
            onClick={async () => {
              const ok = await executeSave()
              if (ok) {
                if (editId) {
                  navigate('/etats/view')
                } else {
                  setSuccess(`Déclaration fiscale n°${form.invoiceNumber.trim()} enregistrée avec succès !`)
                  setForm({ invoiceNumber: '', invoiceDate: '', regime: '', value: '' })
                  setTiersQuery('')
                  setSelectedPartnerId(null)
                }
              } else {
                setError("Une erreur est survenue lors de l'enregistrement.")
              }
            }}
          >
            {loading ? 'Enregistrement…' : editId ? 'Enregistrer les modifications' : 'Enregistrer la déclaration'}
          </button>

          {/* BOUTON CONFORT : masqué en mode édition */}
          {!editId ? (
            <button
              type="button"
              className="BtnSecondary"
              disabled={!canSubmit || loading}
              onClick={async () => {
                const savedInvoiceNumber = form.invoiceNumber.trim()
                const ok = await executeSave()
                if (ok) {
                  setSuccess(`Facture n°${savedInvoiceNumber} enregistrée ! Prête pour le clonage.`)
                  setForm(prev => ({ ...prev, invoiceNumber: '', value: '' }))
                } else {
                  setError("Une erreur est survenue lors de l'enregistrement.")
                }
              }}
            >
              Cloner facture
            </button>
          ) : null}

        </div>
      </form>

      {showPartnerModal ? (
        <PartnerModal
          companyId={companyId}
          companyName={selectedCompany.name}
          initialVatNumber={tiersQuery.trim()}
          onClose={() => setShowPartnerModal(false)}
          onCreated={(created) => {
            addPartner(created)
            setTiersQuery(created.vatNumber)
            setSelectedPartnerId(created.id)
          }}
        />
      ) : null}
    </div>
  )
}
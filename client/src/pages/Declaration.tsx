import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './Declaration.css'

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
  lineNumber: number
  nomenclatureCode: string
  supplementaryUnit: string
  mass: string
  value: string
  provCountryCode: string
  originCountryCode: string
}

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

export default function Declaration() {
  const params = useParams()
  const type = (params.type as DeclarationType | undefined) ?? 'introduction'

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

  const [lines, setLines] = useState<InvoiceLineDraft[]>([])
  const [lineDraft, setLineDraft] = useState<InvoiceLineDraft>({
    lineNumber: 1,
    nomenclatureCode: '',
    supplementaryUnit: '',
    mass: '',
    value: '',
    provCountryCode: '',
    originCountryCode: '',
  })

  const canValidateHeader =
    !!headerDraft.regime &&
    !!headerDraft.natureTransaction &&
    !!headerDraft.tiersVatNumber.trim() &&
    !!headerDraft.invoiceDate.trim()

  return (
    <div className="DeclarationPage">
      <div className="DeclarationTop">
        <div>
          <h1 className="DeclarationTitle">{title}</h1>
          <p>Le formulaire change selon le type de déclaration sélectionné.</p>
        </div>
        <Link to="/" className="DeclarationBackLink">
          Retour
        </Link>
      </div>

      {!isSupported ? (
        <div className="DeclarationPanel">Type de déclaration inconnu.</div>
      ) : null}

      {type === 'introduction' ? (
        <>
          <div className="DeclarationPanel">
            <h2 className="DeclarationPanelTitle">Entête de facture</h2>

            <div className="DeclarationFormGrid">
              <Field label="Numéro de facture">
                <input
                  value={headerDraft.invoiceNumber}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, invoiceNumber: e.target.value }))}
                  className="FormInput"
                  placeholder="Ex: FAC-2026-0001"
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
                <input
                  value={headerDraft.tiersVatNumber}
                  onChange={(e) => setHeaderDraft((p) => ({ ...p, tiersVatNumber: e.target.value }))}
                  className="FormInput"
                  placeholder="Ex: FRXX999999999"
                  disabled={headerValidated}
                />
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
            <p className="DeclarationSmallHint">
              Pays de provenance / origine pré-remplis à partir du tiers ({autoCountryCode || '—'}).
            </p>

            <div className="DeclarationFormGrid">
              <Field label="N° ligne" required>
                <input
                  value={String(lineDraft.lineNumber)}
                  onChange={(e) =>
                    setLineDraft((p) => ({
                      ...p,
                      lineNumber: Number.parseInt(e.target.value || '0', 10) || 0,
                    }))
                  }
                  className="FormInput"
                  disabled={!headerValidated}
                />
              </Field>

              <Field label="Nomenclature (code)" required>
                <input
                  value={lineDraft.nomenclatureCode}
                  onChange={(e) => setLineDraft((p) => ({ ...p, nomenclatureCode: e.target.value }))}
                  className="FormInput"
                  placeholder="Ex: 85171300"
                  disabled={!headerValidated}
                />
              </Field>

              <Field label="Quantité (unités sup.)">
                <input
                  value={lineDraft.supplementaryUnit}
                  onChange={(e) => setLineDraft((p) => ({ ...p, supplementaryUnit: e.target.value }))}
                  className="FormInput"
                  placeholder="Ex: 0"
                  disabled={!headerValidated}
                />
              </Field>

              <Field label="Poids (masse nette)" required>
                <input
                  value={lineDraft.mass}
                  onChange={(e) => setLineDraft((p) => ({ ...p, mass: e.target.value }))}
                  className="FormInput"
                  placeholder="kg"
                  disabled={!headerValidated}
                />
              </Field>

              <Field label="Valeur" required>
                <input
                  value={lineDraft.value}
                  onChange={(e) => setLineDraft((p) => ({ ...p, value: e.target.value }))}
                  className="FormInput"
                  placeholder="€"
                  disabled={!headerValidated}
                />
              </Field>

              <Field label="Pays de provenance" required>
                <input
                  value={lineDraft.provCountryCode}
                  onChange={(e) => setLineDraft((p) => ({ ...p, provCountryCode: e.target.value.toUpperCase() }))}
                  className="FormInput"
                  placeholder={autoCountryCode || 'Ex: FR'}
                  disabled={!headerValidated}
                />
              </Field>

              <Field label="Pays d’origine" required>
                <input
                  value={lineDraft.originCountryCode}
                  onChange={(e) => setLineDraft((p) => ({ ...p, originCountryCode: e.target.value.toUpperCase() }))}
                  className="FormInput"
                  placeholder={autoCountryCode || 'Ex: FR'}
                  disabled={!headerValidated}
                />
              </Field>
            </div>

            <div className="DeclarationActions">
              <button
                type="button"
                className="BtnPrimary"
                disabled={
                  !headerValidated ||
                  !lineDraft.lineNumber ||
                  !lineDraft.nomenclatureCode.trim() ||
                  !lineDraft.mass.trim() ||
                  !lineDraft.value.trim() ||
                  !lineDraft.provCountryCode.trim() ||
                  !lineDraft.originCountryCode.trim()
                }
                onClick={() => {
                  setLines((prev) => [...prev, lineDraft])
                  setLineDraft((p) => ({
                    ...p,
                    lineNumber: p.lineNumber + 1,
                    nomenclatureCode: '',
                    supplementaryUnit: '',
                    mass: '',
                    value: '',
                    provCountryCode: autoCountryCode,
                    originCountryCode: autoCountryCode,
                  }))
                }}
              >
                Ajouter la ligne
              </button>
              <button
                type="button"
                className="BtnSecondary"
                disabled={!headerValidated}
                onClick={() =>
                  setLineDraft((p) => ({
                    ...p,
                    nomenclatureCode: '',
                    supplementaryUnit: '',
                    mass: '',
                    value: '',
                    provCountryCode: autoCountryCode,
                    originCountryCode: autoCountryCode,
                  }))
                }
              >
                Réinitialiser
              </button>
            </div>

            {lines.length ? (
              <div className="LinesList">
                {lines.map((l) => (
                  <div key={`${l.lineNumber}-${l.nomenclatureCode}`} className="LineRow">
                    <div className="LineRowMain">
                      <b>Ligne {l.lineNumber}</b> — NC {l.nomenclatureCode}
                    </div>
                    <div className="LineRowMeta">
                      Prov: {l.provCountryCode} · Orig: {l.originCountryCode} · Poids: {l.mass} · Qté: {l.supplementaryUnit || '—'} · Valeur:{' '}
                      {l.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="LinesEmpty">Aucune ligne pour le moment.</div>
            )}
          </div>
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


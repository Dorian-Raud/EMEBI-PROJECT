import { LineFieldCol } from './FormField'
import type { InvoiceLineDraft } from '../types'

type InvoiceLineFormProps = {
    draft: InvoiceLineDraft
    autoCountryCode: string
    disabled: boolean
    onChange: (draft: InvoiceLineDraft) => void
    onAdd: () => void
}

export function InvoiceLineForm({ draft, autoCountryCode, disabled, onChange, onAdd }: InvoiceLineFormProps) {
    const canAdd =
        !disabled &&
        !!draft.nomenclatureCode.trim() &&
        !!draft.mass.trim() &&
        !!draft.value.trim() &&
        !!draft.provCountryCode.trim() &&
        !!draft.originCountryCode.trim()

    return (
        <div className="LineEntryScroll">
            <div className="LineEntryGrid">
                <LineFieldCol label="Nomenclature" required className="LineFieldColNc">
                    <input value={draft.nomenclatureCode} onChange={(e) => onChange({ ...draft, nomenclatureCode: e.target.value })} className="FormInput" disabled={disabled} />
                </LineFieldCol>
                <LineFieldCol label="Provenance" required className="LineFieldColCtry" title="Pays de provenance">
                    <input value={draft.provCountryCode} onChange={(e) => onChange({ ...draft, provCountryCode: e.target.value.toUpperCase() })} className="FormInput" placeholder={autoCountryCode} disabled={disabled} />
                </LineFieldCol>
                <LineFieldCol label="Origine" required className="LineFieldColCtry" title="Pays d'origine">
                    <input value={draft.originCountryCode} onChange={(e) => onChange({ ...draft, originCountryCode: e.target.value.toUpperCase() })} className="FormInput" placeholder={autoCountryCode} disabled={disabled} />
                </LineFieldCol>
                <LineFieldCol label="Quantité" className="LineFieldColSmall">
                    <input value={draft.supplementaryUnit} onChange={(e) => onChange({ ...draft, supplementaryUnit: e.target.value })} className="FormInput" disabled={disabled} />
                </LineFieldCol>
                <LineFieldCol label="Poids (kg)" required className="LineFieldColSmall">
                    <input value={draft.mass} onChange={(e) => onChange({ ...draft, mass: e.target.value })} className="FormInput" placeholder="Min 1kg" disabled={disabled} />
                </LineFieldCol>
                <LineFieldCol label="Valeur (€)" required className="LineFieldColSmall">
                    <input value={draft.value} onChange={(e) => onChange({ ...draft, value: e.target.value })} className="FormInput" disabled={disabled} />
                </LineFieldCol>
                <div className="LineFieldCol LineFieldColAction">
                    <span className="LineFieldLabel LineFieldLabelInvisible">Action</span>
                    <button type="button" className="BtnPrimary LineAddBtn" disabled={!canAdd} onClick={onAdd}>
                        Ajouter
                    </button>
                </div>
            </div>
        </div>
    )
}
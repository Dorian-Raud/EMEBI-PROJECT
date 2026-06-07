import { useState } from 'react'
import { LineFieldCol } from './FormField'
import type { InvoiceLineDraft, InvoiceLine } from '../types'

type InvoiceLineRowProps = {
    line: InvoiceLine
    disabled: boolean
    onSave: (id: string, draft: InvoiceLineDraft) => void
    onDelete: (id: string) => void
}

export function InvoiceLineRow({ line, disabled, onSave, onDelete }: InvoiceLineRowProps) {
    const [editing, setEditing] = useState(false)
    const [editDraft, setEditDraft] = useState<InvoiceLineDraft | null>(null)

    if (editing && editDraft) {
        return (
            <div className="LineRowFull">
                <div className="LineEntryScroll">
                    <div className="LineEntryGrid LineEntryGridInRow">
                        <LineFieldCol label="Nomenclature" required className="LineFieldColNc">
                            <input
                                value={editDraft.nomenclatureCode}
                                onChange={(e) => setEditDraft((p) => p ? { ...p, nomenclatureCode: e.target.value } : p)}
                                className="FormInput"
                            />
                        </LineFieldCol>
                        <LineFieldCol label="Provenance" required className="LineFieldColCtry" title="Pays de provenance">
                            <input
                                value={editDraft.provCountryCode}
                                onChange={(e) => setEditDraft((p) => p ? { ...p, provCountryCode: e.target.value.toUpperCase() } : p)}
                                className="FormInput"
                            />
                        </LineFieldCol>
                        <LineFieldCol label="Origine" required className="LineFieldColCtry" title="Pays d'origine">
                            <input
                                value={editDraft.originCountryCode}
                                onChange={(e) => setEditDraft((p) => p ? { ...p, originCountryCode: e.target.value.toUpperCase() } : p)}
                                className="FormInput"
                            />
                        </LineFieldCol>
                        <LineFieldCol label="Quantité" className="LineFieldColSmall">
                            <input
                                value={editDraft.supplementaryUnit}
                                onChange={(e) => setEditDraft((p) => p ? { ...p, supplementaryUnit: e.target.value } : p)}
                                className="FormInput"
                            />
                        </LineFieldCol>
                        <LineFieldCol label="Poids (kg)" required className="LineFieldColSmall">
                            <input
                                value={editDraft.mass}
                                onChange={(e) => setEditDraft((p) => p ? { ...p, mass: e.target.value } : p)}
                                className="FormInput"
                            />
                        </LineFieldCol>
                        <LineFieldCol label="Valeur (€)" required className="LineFieldColSmall">
                            <input
                                value={editDraft.value}
                                onChange={(e) => setEditDraft((p) => p ? { ...p, value: e.target.value } : p)}
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
                            onSave(line.id, editDraft)
                            setEditing(false)
                            setEditDraft(null)
                        }}
                    >
                        Enregistrer
                    </button>
                    <button
                        type="button"
                        className="BtnSecondary"
                        onClick={() => {
                            setEditing(false)
                            setEditDraft(null)
                        }}
                    >
                        Annuler
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="LineRowFull">
            <div className="LineRowFullDisplay">
                <div className="LineRowDisplay">
                    <div className="LineRowMain">
                        <b>NC</b> {line.nomenclatureCode} · <b>Prov</b> {line.provCountryCode} · <b>Orig</b>{' '}
                        {line.originCountryCode} · <b>Qté</b> {line.supplementaryUnit || '—'} · <b>Poids</b> {line.mass} ·{' '}
                        <b>Valeur</b> {line.value}
                    </div>
                </div>
                <div className="LineRowBtns">
                    <button
                        type="button"
                        className="BtnSecondary"
                        disabled={disabled}
                        onClick={() => {
                            setEditing(true)
                            setEditDraft({
                                nomenclatureCode: line.nomenclatureCode,
                                supplementaryUnit: line.supplementaryUnit,
                                mass: line.mass,
                                value: line.value,
                                provCountryCode: line.provCountryCode,
                                originCountryCode: line.originCountryCode,
                            })
                        }}
                    >
                        Modifier
                    </button>
                    <button
                        type="button"
                        className="BtnSecondary"
                        disabled={disabled}
                        onClick={() => onDelete(line.id)}
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    )
}
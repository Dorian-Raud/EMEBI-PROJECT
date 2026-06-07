import { useState } from 'react'
import { partnersRequester } from '../lib/api/requester'
import type { Partner } from '../types'

type PartnerModalProps = {
    companyId: string
    companyName: string
    initialVatNumber?: string
    onClose: () => void
    onCreated: (partner: Partner) => void
}

function deriveCountryCodeFromVat(vat: string) {
    const v = vat.trim().toUpperCase()
    const match = v.match(/^([A-Z]{2})/)
    return match ? match[1] : ''
}

export function PartnerModal({
    companyId,
    companyName,
    initialVatNumber = '',
    onClose,
    onCreated,
}: PartnerModalProps) {
    const [partnerForm, setPartnerForm] = useState({
        name: '',
        vatNumber: initialVatNumber,
        isoCode: deriveCountryCodeFromVat(initialVatNumber),
    })
    const [partnerError, setPartnerError] = useState<string | null>(null)

    return (
        <div className="ModalOverlay" role="dialog" aria-modal="true">
            <div className="Modal">
                <div className="ModalHeader">
                    <div className="ModalTitle">Créer un tiers</div>
                    <button type="button" className="IconBtn" onClick={onClose}>×</button>
                </div>

                {partnerError ? <div className="ModalError">{partnerError}</div> : null}

                <div className="ModalBody">
                    <p className="DeclarationSmallHint">
                        Ce tiers sera rattaché au client <b>{companyName}</b>.
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
                    <button type="button" className="BtnSecondary" onClick={onClose}>
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
                                console.error('Erreur création tiers:', res)
                                setPartnerError('Impossible de créer le tiers (erreur serveur ou connexion).')
                                return
                            }
                            if (res.data) {
                                onCreated(res.data as Partner)
                            }
                            onClose()
                        }}
                    >
                        Créer
                    </button>
                </div>
            </div>
        </div>
    )
}
import { useEffect, useMemo, useRef, useState } from 'react'
import { partnersRequester } from '../lib/api/requester'
import type { Partner } from '../types'

export function usePartners(companyId: string) {
    const [partners, setPartners] = useState<Partner[]>([])
    const [partnersLoaded, setPartnersLoaded] = useState(false)
    const [tiersQuery, setTiersQuery] = useState('')
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
    const [showTiersSuggestions, setShowTiersSuggestions] = useState(false)
    const tiersBoxRef = useRef<HTMLDivElement | null>(null)

    // Reset quand le client change
    useEffect(() => {
        setPartners([])
        setPartnersLoaded(false)
        setSelectedPartnerId(null)
        setTiersQuery('')
    }, [companyId])

    // Ferme les suggestions au clic extérieur
    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            const el = tiersBoxRef.current
            if (!el) return
            if (e.target instanceof Node && !el.contains(e.target)) setShowTiersSuggestions(false)
        }
        document.addEventListener('mousedown', onDocMouseDown)
        return () => document.removeEventListener('mousedown', onDocMouseDown)
    }, [])

    const ensurePartnersLoaded = async () => {
        if (partnersLoaded) return
        const res = await partnersRequester.getAll(companyId)
        if (res.ok && res.data) setPartners(res.data)
        setPartnersLoaded(true)
    }

    const tiersSuggestions = useMemo(() => {
        const q = tiersQuery.trim().toUpperCase()
        if (!q) return partners.slice(0, 8)
        return partners
            .filter((p) => p.vatNumber.toUpperCase().includes(q) || p.name.toUpperCase().includes(q))
            .slice(0, 8)
    }, [partners, tiersQuery])

    const selectPartner = (partner: Partner) => {
        setSelectedPartnerId(partner.id)
        setTiersQuery(partner.vatNumber)
        setShowTiersSuggestions(false)
    }

    const addPartner = (partner: Partner) => {
        setPartners((prev) => [partner, ...prev])
        selectPartner(partner)
    }

    const resetPartners = () => {
        setSelectedPartnerId(null)
        setTiersQuery('')
    }

    return {
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
    }
}
import { useEffect, useMemo, useState } from 'react'

export const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

/** Tout élément filtrable par période doit exposer un mois et une année. */
export interface PeriodItem {
    month: number
    year: number
}

/**
 * usePeriodFilter — logique partagée de filtre par période + pagination.
 *
 * Générique : fonctionne sur n'importe quelle liste d'éléments ayant
 * `month` / `year` (factures, déclarations, etc.).
 *
 * - Filtre la liste par mois et/ou année (côté client).
 * - Dérive les années réellement présentes dans les données (pour alimenter le select).
 * - Pagine le résultat, et revient en page 1 dès qu'un filtre ou les données changent.
 */
export function usePeriodFilter<T extends PeriodItem>(items: T[], pageSize = 20) {
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')
    const [page, setPage] = useState(1)

    const filtered = useMemo(
        () =>
            items.filter(
                (item) =>
                    (month === '' || item.month === Number(month)) &&
                    (year === '' || item.year === Number(year))
            ),
        [items, month, year]
    )

    const years = useMemo(() => {
        const set = new Set<number>()
        items.forEach((item) => { if (item.year) set.add(item.year) })
        return [...set].sort((a, b) => b - a)
    }, [items])

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
    const currentPage = Math.min(page, pageCount)
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    // Revenir à la première page dès qu'un filtre ou les données changent
    useEffect(() => { setPage(1) }, [month, year, items])

    return {
        month,
        setMonth,
        year,
        setYear,
        years,
        filtered,
        paged,
        page: currentPage,
        setPage,
        pageCount,
    }
}

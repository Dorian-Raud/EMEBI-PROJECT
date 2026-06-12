import { useMemo, useState } from 'react'
import { usePagination } from './usePagination'

export { monthNames } from '../constants/period'

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
 * - Délègue la pagination à usePagination (retour auto en page 1 inclus).
 */
export function usePeriodFilter<T extends PeriodItem>(items: T[], pageSize = 20) {
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')

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

    const { paged, page, setPage, pageCount } = usePagination(filtered, pageSize)

    return {
        month,
        setMonth,
        year,
        setYear,
        years,
        filtered,
        paged,
        page,
        setPage,
        pageCount,
    }
}

import { useEffect, useMemo, useState } from 'react'

/**
 * usePagination — pagination côté client réutilisable.
 *
 * Découpe une liste en pages et revient en page 1 dès que les données changent.
 * Sert de brique de base à d'autres hooks (ex: usePeriodFilter) ou directement
 * dans une page.
 */
export function usePagination<T>(items: T[], pageSize = 20) {
    const [page, setPage] = useState(1)

    const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
    const currentPage = Math.min(page, pageCount)
    const paged = useMemo(
        () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [items, currentPage, pageSize]
    )

    // Revenir à la première page dès que les données changent
    useEffect(() => { setPage(1) }, [items])

    return {
        paged,
        page: currentPage,
        setPage,
        pageCount,
        total: items.length,
    }
}

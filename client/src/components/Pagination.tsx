import './Pagination.css'

interface PaginationProps {
    /** Nombre total d'éléments filtrés (pour le compteur). */
    total: number
    page: number
    pageCount: number
    onPageChange: (page: number) => void
    /** Libellé de l'élément au singulier (ex: "facture", "déclaration"). */
    itemLabel?: string
}

/** Barre de pagination réutilisable : compteur + boutons précédent / suivant. */
export function Pagination({ total, page, pageCount, onPageChange, itemLabel = 'élément' }: PaginationProps) {
    return (
        <div className="Pagination">
            <span className="PaginationInfo">
                {total} {itemLabel}{total > 1 ? 's' : ''} · page {page}/{pageCount}
            </span>
            <div className="PaginationBtns">
                <button
                    type="button"
                    className="PaginationBtn"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                >
                    ← Précédent
                </button>
                <button
                    type="button"
                    className="PaginationBtn"
                    onClick={() => onPageChange(Math.min(pageCount, page + 1))}
                    disabled={page >= pageCount}
                >
                    Suivant →
                </button>
            </div>
        </div>
    )
}

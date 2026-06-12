export const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

/**
 * Années récentes pour alimenter un select de période quand aucune donnée
 * n'est encore chargée : année courante puis les précédentes.
 * recentYears(4) en 2026 → [2026, 2025, 2024, 2023]
 */
export function recentYears(count = 4): number[] {
    const current = new Date().getFullYear()
    return Array.from({ length: count }, (_, i) => current - i)
}

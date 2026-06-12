# Spec — Étape 2 : Boutons de génération des états (frontend)

## Contexte
Sur la page États (période déjà fixée en amont), proposer **3 boutons** — un par flux
(Introduction, Expédition, Déclaration fiscale) — qui téléchargent le PDF correspondant
(endpoint de l'étape 1). Un bouton est **désactivé avec une infobulle explicative** s'il n'y a
aucune facture de ce flux pour la période. Les boutons sont placés **à côté du nombre de pages**
(barre de pagination).

## Principe clé : les boutons reflètent la PÉRIODE, pas les filtres du tableau
Les 3 boutons (et leur état activé/désactivé) dépendent de **tout** ce qui existe pour la période,
indépendamment de la recherche `q` et du select Flux du tableau. Conséquence : on charge l'ensemble
de la période une fois, puis on filtre le tableau côté client.

### Refactor de `load()` dans `Etats.tsx`
- `load()` récupère **tout le périmètre de la période** : `invoicesRequester.getAll(companyId, { month, year })`
  (sans `flow` ni `q`) **+** `declarationsFiscalesRequester.getAll(companyId, { month, year })`.
- Le select **Flux** et la recherche **`q`** deviennent des filtres **client-side instantanés**
  sur la liste `invoices` (dérivés via `useMemo`). Le bouton « Rechercher » devient inutile → le retirer.
- Comptes par flux (pour les boutons), dérivés de `invoices` (toute la période) :
  `counts = { INTRODUCTION, EXPEDITION, FISCALE }` (nombre par `inv.flow`).
- La pagination (`usePagination`, 10/page) s'applique à la liste **filtrée** (q + flux).

## Boutons PDF
- Composant ou bloc `EtatsPdfBar` rendu **dès qu'une période est sélectionnée** (même si le tableau filtré est vide),
  contenant 3 boutons : « État Introduction », « État Expédition », « État Déclaration fiscale ».
- Par bouton, flux `F` :
  - `disabled = counts[F] === 0`.
  - Si désactivé : `title="Aucune facture <libellé> pour <Mois Année>"` (infobulle native au survol).
  - Au clic (si actif) : ouvrir l'URL PDF → déclenche le téléchargement.
- Placement : dans la même rangée que la pagination (`<Pagination>` à gauche, boutons à droite).
  Rendre cette rangée toujours visible quand la période est définie (sortir la barre du bloc conditionnel
  « tableau non vide »).

### URL de téléchargement
Ajouter un helper requester (`client/src/lib/api/requester.ts`) :
```ts
export const etatsRequester = {
  pdfUrl: (companyId: string, month: number, year: number, flow: string) =>
    `${import.meta.env.VITE_BASE_API_URL}/etats/pdf?companyId=${companyId}&month=${month}&year=${year}&flow=${flow}`,
}
```
Au clic : `window.open(etatsRequester.pdfUrl(...), '_blank')` (les cookies d'auth sont envoyés).

## Fichiers
- Modifié `client/src/pages/Etats.tsx` — refactor `load()` (charge toute la période), filtres q/flux
  client-side, comptes par flux, barre des 3 boutons + suppression du bouton « Rechercher ».
- Modifié `client/src/lib/api/requester.ts` — `etatsRequester.pdfUrl`.
- Modifié `client/src/pages/Etats.css` — styles `.EtatsPdfBar` / boutons (réutiliser le style `EtatsBtn`).

## Vérification
1. `npx tsc --noEmit` (client) → 0 erreur.
2. Page États sur une période contenant des factures Intro + Exp mais **pas** de fiscale :
   les 2 premiers boutons sont actifs, le bouton fiscal est **grisé** et affiche l'infobulle au survol.
3. Clic sur un bouton actif → le PDF du bon flux se télécharge (recouper avec l'étape 1).
4. Le select Flux et la recherche filtrent le tableau **instantanément** ; les boutons PDF ne
   changent pas d'état quand on filtre (ils suivent la période, pas le filtre).
5. Pagination toujours à 10/page sur la liste filtrée.

# Spec — Étape 1 : Génération PDF des états (backend)

## Contexte
On veut produire un PDF officiel par flux (Introduction, Expédition, Déclaration fiscale)
pour une société + une période donnée. Un PDF = un flux. Le document reprend les mêmes
données que le tableau de la page États, **plus** trois totaux : montant total, nombre de
factures, nombre de lignes.

Librairie retenue : **pdfmake** (déclaratif, tableaux/totaux natifs, sans Chromium).

## Endpoint
`GET /api/etats/pdf?companyId=<uuid>&month=<1-12>&year=<YYYY>&flow=<INTRODUCTION|EXPEDITION|FISCALE>`

- Tous les paramètres requis. `flow` doit être l'une des 3 valeurs → sinon `400`.
- Réponse : `Content-Type: application/pdf`,
  `Content-Disposition: attachment; filename="etat-<flux>-<MM>-<YYYY>.pdf"`, corps = binaire PDF.
- Si aucune facture pour ce flux/période → `404` (le frontend désactive déjà le bouton, c'est un garde-fou).

## Données (réutiliser l'existant)
- INTRODUCTION / EXPEDITION → `listInvoices({ companyId, flow, month, year })`
  (`api/src/services/invoiceService.ts`) — inclut `partner` et `lines` (`{ id, value }`).
- FISCALE → `listDeclarationsFiscales({ companyId, month, year })`
  (`api/src/services/declarationFiscaleService.ts`).

### Lignes du tableau (mêmes colonnes que la page États)
- **Intro/Exp** : N° facture · Date (`invoiceDate`) · Tiers (`partner.name` + `partner.vatNumber`) · Régime · Nature (`transactionNature`) · Total HT (= Σ `lines.value`).
- **Fiscale** : N° facture · Date · Tiers · Régime · Valeur (`value`). (Pas de colonne Nature.)

### Totaux (bloc en bas du document)
- **Montant total** = Σ Total HT (intro/exp) ou Σ `value` (fiscale).
- **Nombre de factures** = nombre d'en-têtes / de déclarations.
- **Nombre de lignes** = Σ `lines.length` (intro/exp) ; **= nombre de factures** (fiscale, décision actée).

## Mise en page pdfmake
- En-tête : nom société · « État <Flux libellé> » · « Période : <Mois Année> » · « Généré le <date> ».
- Tableau des lignes (largeurs auto, en-têtes en gras, zébrage léger).
- Bloc totaux aligné à droite sous le tableau (3 lignes libellé/valeur, montant formaté EUR).
- Pied de page : numéro de page.

### Approche fonts (éviter de vendoriser des .ttf)
Utiliser le build prêt-à-l'emploi avec sa VFS :
```ts
import pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
;(pdfMake as any).vfs = (vfsFonts as any).pdfMake?.vfs ?? (vfsFonts as any).vfs
pdfMake.createPdf(docDefinition).getBuffer((buf) => { res.send(buf) })
```
Fallback si l'import VFS diffère selon la version : `PdfPrinter` + 4 Roboto .ttf sous
`api/src/pdf/fonts/` (résoudre le chemin via `fileURLToPath(import.meta.url)` — projet en ESM).

## Fichiers
- Nouveau `api/src/services/etatPdfService.ts` — assemblage données + totaux + `docDefinition` + buffer.
- Nouveau `api/src/controllers/etatController.ts` — `getEtatPdf` (validation params, stream).
- Nouveau `api/src/routers/etatRouter.ts` — `GET /pdf`.
- Modifié `api/src/routers/index.ts` — `router.use("/api/etats", etatRouter)`.
- `package.json` (api) — ajouter `pdfmake` (+ `@types/pdfmake` en dev).

## Vérification
1. `npm i pdfmake` dans `api`, `npx tsc --noEmit` → 0 erreur.
2. Ouvrir dans le navigateur (connecté) :
   `…/api/etats/pdf?companyId=<id>&month=3&year=2026&flow=INTRODUCTION` → un PDF se télécharge.
3. Vérifier sur le PDF : bonnes colonnes, lignes correspondant au tableau États (même période/flux),
   et les 3 totaux exacts (recouper montant/nb factures/nb lignes avec la liste).
4. Tester les 3 flux ; tester un flux sans données → `404`.

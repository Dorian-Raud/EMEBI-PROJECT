export const NATURES_INTRO = [
    { value: '11', label: '11 : Achat/vente ferme (excepté commerce direct avec/par des particuliers)' },
    { value: '12', label: '12 : Commerce direct avec/par des particuliers (y compris les ventes à distance)' },
    { value: '21', label: '21 : Retour de biens (hors remplacement)' },
    { value: '22', label: '22 : Remplacement de biens retournés' },
    { value: '23', label: '23 : Remplacement (par ex. sous garantie) de biens non retournés' },
    { value: '31', label: '31 : Mouvements vers/depuis un entrepôt (à l’exclusion des opérations énumérées à la modalité 32)' },
    { value: '32', label: '32 : Livraison pour vente à vue ou à l’essai' },
    { value: '33', label: '33 : Leasing financier (location-vente)' },
    { value: '34', label: '34 : Transactions impliquant un transfert de propriété sans compensation financière (y compris troc)' },
    { value: '41', label: '41 : Opérations en vue d’un travail à façon : biens réexpédiés vers l’État membre d’expédition initial' },
    { value: '42', label: '42 : Opérations en vue d’un travail à façon : biens non réexpédiés vers l’État membre d’expédition initial' },
    { value: '51', label: '51 : Opération après travail à façon. Biens réexpédiés vers l’État membre d’expédition initial' },
    { value: '52', label: '52 : Opération après travail à façon : biens non réexpédiés vers l’État membre d’expédition initial' },
    { value: '65', label: '65 : Transfert de biens sous le régime du perfectionnement actif' },
    { value: '71', label: '71 : Transport de biens vers/depuis un autre État membre après importation d’un pays hors de l’UE' },
    { value: '72', label: '72 : Transport de biens vers/depuis un autre État membre en vue de l’exporter hors de l’UE' },
    { value: '80', label: '80 : Fourniture de matériaux dans le cadre d’un contrat de construction ou de génie civil' },
    { value: '91', label: '91 : Location, prêt et leasing opérationnel pour une durée supérieure à 24 mois' },
    { value: '99', label: '99 : Autres' },
] as const

export const REGIMES_INTRO = [
    { value: '11', label: '11 : Achat/vente ferme' },
    { value: '19', label: '19 : Autres Introductions' },
] as const

export const REGIMES_EXPEDITION = [
    { value: '21', label: '21 : Achat/vente ferme' },
    { value: '29', label: '29 : Autres Expéditions' },
] as const

export const TRANSPORT_MODES = [
    { value: '1', label: '1 : Transport maritime' },
    { value: '2', label: '2 : Transport ferroviaire' },
    { value: '3', label: '3 : Transport routier' },
    { value: '4', label: '4 : Transport aérien' },
    { value: '5', label: '5 : Envoi postal' },
    { value: '7', label: '7 : Installations fixes' },
    { value: '8', label: '8 : Navigation intérieure' },
    { value: '9', label: '9 : Propulsion propre' },
] as const
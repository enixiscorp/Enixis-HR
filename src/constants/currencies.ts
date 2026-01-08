export const currencies = [
    { code: 'XOF', name: 'Franc CFA (BCEAO)', symbol: 'FCFA' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar américain', symbol: '$' },
    { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£' },
    { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
    { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
    { code: 'AUD', name: 'Dollar australien', symbol: 'A$' },
    { code: 'CNY', name: 'Yuan renminbi chinois', symbol: '¥' },
    { code: 'INR', name: 'Roupie indienne', symbol: '₹' },
    { code: 'BRL', name: 'Réal brésilien', symbol: 'R$' },
    { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R' },
    { code: 'NGN', name: 'Naira nigérian', symbol: '₦' },
    { code: 'MAD', name: 'Dirham marocain', symbol: 'DH' },
    // Ajoutez d'autres devises si nécessaire
].sort((a, b) => a.name.localeCompare(b.name)) // Tri alphabétique par nom

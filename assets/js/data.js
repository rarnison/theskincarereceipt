/*
  TheSkinCareReceipt — site content
  ---------------------------------
  Everything on the Shelf, the Routine Printer and the Returns Desk is drawn
  from this file. Edit, add or remove entries here; no other file needs to change.

  PRODUCT FIELDS
    id        unique, lowercase, no spaces (the Routine Printer refers to these)
    name      shown on the shelf card
    short     how it prints on a receipt (keep it under ~24 characters)
    step      cleanse | treat | moisturize | protect
    type      which drawing to use: dropper | jar | tube | pump | bottle
    code      2-4 characters printed on the drawing's label
    price     number, what you paid
    size      text, e.g. "30 ml"
    days      roughly how many days one unit lasts (used for cost per day)
    goodFor   short text
    note      your one-line review
    verdict   grail | worth | nice | skip
    link      optional URL; adds a "Where to buy" link to the card
    colors    stage / body / cap / label — any CSS color or one of the names
              lilac, lilac-deep, lilac-soft, cream, paper, sand, amber, honey
*/
window.TSCR = {
  currency: '$',

  products: [
    {
      id: 'gel-cleanser', name: 'Gentle Gel Cleanser', short: 'Gentle gel cleanser',
      step: 'cleanse', type: 'pump', code: 'GEL', price: 14, size: '236 ml', days: 90,
      goodFor: 'Oily · combo · most skin',
      note: 'Cleans without the squeaky, tight feeling. That is the entire review.',
      verdict: 'grail',
      colors: { stage: 'honey', body: 'paper', cap: 'lilac-deep', label: 'lilac' },
    },
    {
      id: 'milk-cleanser', name: 'Milky Cream Cleanser', short: 'Milky cream cleanser',
      step: 'cleanse', type: 'tube', code: 'MILK', price: 16, size: '150 ml', days: 75,
      goodFor: 'Dry · sensitive',
      note: 'Feels like nothing, which is exactly what dry skin wants from a cleanser.',
      verdict: 'worth',
      colors: { stage: 'lilac', body: 'cream', cap: 'amber', label: 'paper' },
    },
    {
      id: 'niacinamide', name: 'Niacinamide 10% Serum', short: 'Niacinamide 10% serum',
      step: 'treat', type: 'dropper', code: 'B3', price: 9, size: '30 ml', days: 90,
      goodFor: 'Oily · pores · shine',
      note: 'Less shine by week three. Costs less than lunch.',
      verdict: 'worth',
      colors: { stage: 'lilac', body: 'amber', cap: 'paper', label: 'cream' },
    },
    {
      id: 'vitc', name: 'Vitamin C 15% Serum', short: 'Vitamin C 15% serum',
      step: 'treat', type: 'dropper', code: 'C15', price: 28, size: '30 ml', days: 75,
      goodFor: 'Dullness · dark spots',
      note: 'Brighter by week six. Keep it in a drawer or it turns orange and useless.',
      verdict: 'worth',
      colors: { stage: 'honey', body: '#C96A12', cap: 'ink', label: 'paper' },
    },
    {
      id: 'retinal', name: 'Retinal 0.05% Night Serum', short: 'Retinal 0.05% serum',
      step: 'treat', type: 'pump', code: 'RET', price: 34, size: '30 ml', days: 100,
      goodFor: 'Texture · fine lines',
      note: 'Start two nights a week. The payoff shows up around month three.',
      verdict: 'grail',
      colors: { stage: 'lilac-deep', body: 'honey', cap: 'paper', label: 'paper' },
    },
    {
      id: 'bha', name: 'Salicylic Acid 2% Liquid', short: 'Salicylic acid 2%',
      step: 'treat', type: 'bottle', code: 'BHA', price: 13, size: '118 ml', days: 120,
      goodFor: 'Breakouts · blackheads',
      note: "The one exfoliant I'd keep. Three nights a week is plenty.",
      verdict: 'worth',
      colors: { stage: 'sand', body: 'lilac-soft', cap: 'lilac-deep', label: 'paper' },
    },
    {
      id: 'azelaic', name: 'Azelaic Acid 10% Cream', short: 'Azelaic acid 10%',
      step: 'treat', type: 'tube', code: 'AZ', price: 12, size: '30 ml', days: 60,
      goodFor: 'Redness · post-spot marks',
      note: 'Quiet, slow and kind to cranky skin. Underrated.',
      verdict: 'worth',
      colors: { stage: 'honey', body: 'paper', cap: 'lilac-deep', label: 'lilac' },
    },
    {
      id: 'ha', name: 'Hyaluronic Acid Serum', short: 'Hyaluronic serum',
      step: 'treat', type: 'dropper', code: 'HA', price: 8, size: '30 ml', days: 90,
      goodFor: 'Dehydrated · tight',
      note: "Put it on damp skin and seal it in, or don't bother.",
      verdict: 'nice',
      colors: { stage: 'sand', body: 'lilac', cap: 'paper', label: 'paper' },
    },
    {
      id: 'ceramide', name: 'Ceramide Barrier Cream', short: 'Ceramide barrier cream',
      step: 'moisturize', type: 'jar', code: 'CER', price: 18, size: '340 g', days: 150,
      goodFor: 'Dry · sensitive · winter',
      note: "One tub, five months. That's twelve cents a day.",
      verdict: 'grail',
      colors: { stage: 'lilac', body: 'cream', cap: 'paper', label: 'honey' },
    },
    {
      id: 'gelcream', name: 'Gel-Cream Moisturizer', short: 'Gel-cream moisturizer',
      step: 'moisturize', type: 'jar', code: 'GEL', price: 16, size: '50 ml', days: 60,
      goodFor: 'Oily · combo · humid days',
      note: "Hydration that doesn't feel like wearing a hat indoors.",
      verdict: 'worth',
      colors: { stage: 'honey', body: 'lilac-soft', cap: 'lilac-deep', label: 'paper' },
    },
    {
      id: 'spf50', name: 'Invisible Fluid SPF 50', short: 'Invisible fluid SPF 50',
      step: 'protect', type: 'bottle', code: '50', price: 19, size: '50 ml', days: 45,
      goodFor: 'Everyone, every day',
      note: 'No white cast, no pilling, no excuses.',
      verdict: 'grail',
      colors: { stage: 'lilac-deep', body: 'honey', cap: 'amber', label: 'paper' },
    },
    {
      id: 'mineral', name: 'Tinted Mineral SPF 40', short: 'Tinted mineral SPF 40',
      step: 'protect', type: 'tube', code: '40', price: 24, size: '50 ml', days: 45,
      goodFor: 'Sensitive · reactive',
      note: 'For skin that stings at chemical filters. Blends better than it has any right to.',
      verdict: 'worth',
      colors: { stage: 'lilac', body: 'honey', cap: 'paper', label: 'cream' },
    },
  ],

  /*
    Returns Desk slips.
    tone: skip (red stamp) | keep (gold stamp) | note (purple stamp)
  */
  slips: [
    {
      claim: 'Shrinks your pores.',
      reality: 'Pore size is mostly genetic. You can keep them clear so they look smaller, but nothing opens or closes them.',
      line: ['Refund due', 'Your $38'], stamp: 'Skip it', tone: 'skip',
    },
    {
      claim: 'No sun, no sunscreen.',
      reality: 'Up to 80% of UV gets through cloud, and UVA passes through window glass. Wear it anyway.',
      line: ['Daily charge', '2 fingers'], stamp: 'Wear it', tone: 'keep',
    },
    {
      claim: "If it tingles, it's working.",
      reality: "Tingling is irritation talking. Results don't need to hurt.",
      line: ['Refund due', '1 skin barrier'], stamp: 'Return it', tone: 'skip',
    },
    {
      claim: 'Pricier means better.',
      reality: 'The $9 serum and the $60 one often share the same star ingredient. Pay for the formula, not the jar.',
      line: ['You save', '$51.00'], stamp: 'Check the label', tone: 'note',
    },
    {
      claim: 'Natural is gentler.',
      reality: 'Poison ivy is natural. Fragrant plant oils are some of the most common irritants going.',
      line: ['Refund due', 'In full'], stamp: 'Skip it', tone: 'skip',
    },
    {
      claim: 'You need ten steps.',
      reality: 'Cleanser, moisturizer, sunscreen. Everything after that is extra credit.',
      line: ['Steps refunded', '7'], stamp: 'Refunded', tone: 'keep',
    },
    {
      claim: 'Oily skin should skip moisturizer.',
      reality: 'Oily skin can still be dehydrated. Go light, not without.',
      line: ['Exchange for', 'Gel-cream'], stamp: 'Exchange', tone: 'note',
    },
  ],
};

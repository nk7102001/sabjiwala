// models/sabjiCategories.js
const sabjiCategories = [
  {
    id: 1,
    name: 'Carrot',
    slug: 'carrot',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    name: 'Tomato',
    slug: 'tomato',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    name: 'Potato',
    slug: 'potato',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 4,
    name: 'Onion',
    slug: 'onion',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 5,
    name: 'Brinjal',
    slug: 'brinjal',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 6,
    name: 'Cabbage',
    slug: 'cabbage',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
  }
];

// Freeze to avoid accidental runtime mutations
module.exports = Object.freeze(sabjiCategories);

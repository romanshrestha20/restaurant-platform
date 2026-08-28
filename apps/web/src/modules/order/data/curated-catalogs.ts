import type { CustomerCatalog } from '../types/customer-order.types';

export const CURATED_CATALOGS: Record<string, CustomerCatalog> = {
  'marlow-sage': {
    id: 'marlow-sage',
    name: 'Marlow & Sage',
    slug: 'marlow-sage',
    description: 'Modern European dishes crafted from seasonal local ingredients and Nordic flavors.',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    settings: {
      estimatedPrepMinutes: 25,
      minimumOrder: '15.00',
      deliveryFee: '1.99',
      serviceFee: '0.99',
      taxRate: '0.14',
    },
    media: [
      {
        type: 'COVER',
        alt: 'Marlow & Sage',
        media: {
          url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
        },
      },
    ],
    menus: [
      {
        id: 'menu-ms-1',
        name: 'Main Menu',
        description: 'Available every day from 11:30 to 22:00',
        categories: [
          {
            id: 'cat-ms-starters',
            name: 'Starters & Small Plates',
            description: 'Begin your meal with freshly prepared Nordic-European delicacies.',
            items: [
              {
                id: 'item-ms-1',
                name: 'Smoked Salmon Carpaccio',
                description: 'Thinly sliced wild salmon with pickled shallots, caperberries, and dill oil.',
                basePrice: '14.50',
                preparationTime: 12,
                calories: 320,
                isFeatured: true,
                media: [
                  {
                    alt: 'Smoked Salmon Carpaccio',
                    media: {
                      url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [
                  {
                    id: 'addon-grp-1',
                    name: 'Extra Garnishes',
                    required: false,
                    minSelection: 0,
                    maxSelection: 2,
                    addOns: [
                      { id: 'addon-1', name: 'Rye Crispbread', price: '2.00' },
                      { id: 'addon-2', name: 'Crème Fraîche Dip', price: '1.50' },
                    ],
                  },
                ],
              },
              {
                id: 'item-ms-2',
                name: 'Roasted Beetroot Tartare',
                description: 'Caramelized local beets, goat cheese mousse, roasted hazelnuts, aged balsamic.',
                basePrice: '12.00',
                preparationTime: 10,
                calories: 280,
                isFeatured: false,
                media: [
                  {
                    alt: 'Roasted Beetroot Tartare',
                    media: {
                      url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [],
              },
            ],
          },
          {
            id: 'cat-ms-mains',
            name: 'Artisanal Mains',
            description: 'Carefully cooked meat, fish, and seasonal vegetables.',
            items: [
              {
                id: 'item-ms-3',
                name: 'Pan-Seared Arctic Char',
                description: 'Crispy skin Arctic char served over chanterelle risotto and lemon butter sauce.',
                basePrice: '26.00',
                preparationTime: 20,
                calories: 580,
                isFeatured: true,
                media: [
                  {
                    alt: 'Pan-Seared Arctic Char',
                    media: {
                      url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [
                  {
                    id: 'var-grp-1',
                    name: 'Side Choice',
                    options: [
                      { id: 'var-opt-1', name: 'Chanterelle Risotto', priceAdjustment: '0.00' },
                      { id: 'var-opt-2', name: 'Roasted Root Vegetables', priceAdjustment: '0.00' },
                    ],
                  },
                ],
                addOnGroups: [],
              },
              {
                id: 'item-ms-4',
                name: 'Braised Beef Short Rib',
                description: 'Slow-cooked in red wine reduction, served with truffle potato purée and glazed baby carrots.',
                basePrice: '28.50',
                preparationTime: 22,
                calories: 720,
                isFeatured: true,
                media: [
                  {
                    alt: 'Braised Beef Short Rib',
                    media: {
                      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [
                  {
                    id: 'addon-grp-2',
                    name: 'Sauces & Sides',
                    required: false,
                    minSelection: 0,
                    maxSelection: 2,
                    addOns: [
                      { id: 'addon-3', name: 'Extra Truffle Jus', price: '3.00' },
                      { id: 'addon-4', name: 'Broccolini with Garlic', price: '4.50' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'cat-ms-desserts',
            name: 'Desserts & Sweets',
            description: 'Handcrafted sweets and sommelier-curated selections.',
            items: [
              {
                id: 'item-ms-5',
                name: 'Nordic Cloudberry Pavlova',
                description: 'Crisp meringue, whipped vanilla mascarpone, and fresh wild cloudberries.',
                basePrice: '9.50',
                preparationTime: 8,
                calories: 310,
                isFeatured: false,
                media: [
                  {
                    alt: 'Pavlova',
                    media: {
                      url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [],
              },
            ],
          },
        ],
      },
    ],
  },
  'kiln-house': {
    id: 'kiln-house',
    name: 'Kiln House',
    slug: 'kiln-house',
    description: 'Slow-fermented sourdough pizza baked in our 450°C wood-fired kiln.',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    settings: {
      estimatedPrepMinutes: 30,
      minimumOrder: '12.00',
      deliveryFee: '0.99',
      serviceFee: '0.99',
      taxRate: '0.14',
    },
    media: [
      {
        type: 'COVER',
        alt: 'Kiln House Pizza',
        media: {
          url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        },
      },
    ],
    menus: [
      {
        id: 'menu-kh-1',
        name: 'Pizza & Antipasti',
        description: 'Baked fresh to order',
        categories: [
          {
            id: 'cat-kh-pizzas',
            name: 'Wood-Fired Pizzas',
            description: '48-hour fermented sourdough crust with San Marzano tomatoes and Fior di Latte.',
            items: [
              {
                id: 'item-kh-1',
                name: 'Margherita Verace',
                description: 'San Marzano D.O.P. sauce, buffalo mozzarella, fresh basil, organic extra virgin olive oil.',
                basePrice: '13.50',
                preparationTime: 15,
                calories: 640,
                isFeatured: true,
                media: [
                  {
                    alt: 'Margherita Verace',
                    media: {
                      url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [
                  {
                    id: 'var-crust',
                    name: 'Crust Style',
                    options: [
                      { id: 'opt-reg', name: 'Classic Neapolitan', priceAdjustment: '0.00' },
                      { id: 'opt-well', name: 'Extra Crispy', priceAdjustment: '0.00' },
                    ],
                  },
                ],
                addOnGroups: [
                  {
                    id: 'addon-pizza-toppings',
                    name: 'Extra Toppings',
                    required: false,
                    minSelection: 0,
                    maxSelection: 3,
                    addOns: [
                      { id: 'add-burrata', name: 'Whole Fresh Burrata', price: '4.00' },
                      { id: 'add-prosciutto', name: 'Prosciutto di Parma', price: '3.50' },
                      { id: 'add-chili', name: 'Spicy Calabrian Chili', price: '1.00' },
                    ],
                  },
                ],
              },
              {
                id: 'item-kh-2',
                name: 'Tartufo & Funghi',
                description: 'Fior di latte, roasted wild mushrooms, truffle cream, thyme, parmesan shavings.',
                basePrice: '16.80',
                preparationTime: 16,
                calories: 710,
                isFeatured: true,
                media: [
                  {
                    alt: 'Tartufo Pizza',
                    media: {
                      url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [],
              },
            ],
          },
        ],
      },
    ],
  },
  'nori-salt': {
    id: 'nori-salt',
    name: 'Nori & Salt',
    slug: 'nori-salt',
    description: 'Artisanal sushi, sashimi, and warm ramen bowls with wild-caught fish.',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    settings: {
      estimatedPrepMinutes: 20,
      minimumOrder: '20.00',
      deliveryFee: '0.00',
      serviceFee: '0.99',
      taxRate: '0.14',
    },
    media: [
      {
        type: 'COVER',
        alt: 'Nori & Salt',
        media: {
          url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
        },
      },
    ],
    menus: [
      {
        id: 'menu-ns-1',
        name: 'Sushi & Nigiri',
        description: 'Fresh sushi made to order',
        categories: [
          {
            id: 'cat-ns-sushi',
            name: 'Nigiri & Rolls',
            description: 'Fresh sashimi-grade sushi crafted to order.',
            items: [
              {
                id: 'item-ns-1',
                name: 'Chef’s Nigiri Omakase (8 pcs)',
                description: 'Salmon, bluefin tuna, sea bass, king prawn, scallop, unagi, yellowtail, and tamago.',
                basePrice: '22.00',
                preparationTime: 15,
                calories: 420,
                isFeatured: true,
                media: [
                  {
                    alt: 'Nigiri Set',
                    media: {
                      url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [],
              },
            ],
          },
        ],
      },
    ],
  },
  'copper-pot': {
    id: 'copper-pot',
    name: 'Copper Pot',
    slug: 'copper-pot',
    description: 'Heritage Indian curries, fragrant biryanis, and tandoori-baked breads.',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    settings: {
      estimatedPrepMinutes: 35,
      minimumOrder: '15.00',
      deliveryFee: '1.49',
      serviceFee: '0.99',
      taxRate: '0.14',
    },
    media: [
      {
        type: 'COVER',
        alt: 'Copper Pot',
        media: {
          url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
        },
      },
    ],
    menus: [
      {
        id: 'menu-cp-1',
        name: 'Heritage Curries',
        description: 'Authentic Indian specialties',
        categories: [
          {
            id: 'cat-cp-curry',
            name: 'Signature Curries',
            description: 'Slow-simmered in copper handis with freshly ground spices.',
            items: [
              {
                id: 'item-cp-1',
                name: 'Old Delhi Butter Chicken',
                description: 'Tender tandoori chicken simmered in rich velvety tomato, butter, and fenugreek gravy.',
                basePrice: '17.50',
                preparationTime: 20,
                calories: 680,
                isFeatured: true,
                media: [
                  {
                    alt: 'Butter Chicken',
                    media: {
                      url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [
                  {
                    id: 'var-spice',
                    name: 'Spice Level',
                    options: [
                      { id: 'opt-mild', name: 'Mild & Creamy', priceAdjustment: '0.00' },
                      { id: 'opt-med', name: 'Medium Spice', priceAdjustment: '0.00' },
                      { id: 'opt-hot', name: 'Authentic Indian Hot', priceAdjustment: '0.00' },
                    ],
                  },
                ],
                addOnGroups: [
                  {
                    id: 'addon-naan',
                    name: 'Breads & Rice',
                    required: false,
                    minSelection: 0,
                    maxSelection: 2,
                    addOns: [
                      { id: 'add-garlic-naan', name: 'Garlic Butter Naan', price: '3.50' },
                      { id: 'add-basmati', name: 'Fragrant Saffron Rice', price: '3.00' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  'green-terrace': {
    id: 'green-terrace',
    name: 'Green Terrace',
    slug: 'green-terrace',
    description: '100% plant-based nourish bowls, artisan smoothies, and vegan sourdough toasts.',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    settings: {
      estimatedPrepMinutes: 25,
      minimumOrder: '10.00',
      deliveryFee: '1.99',
      serviceFee: '0.99',
      taxRate: '0.14',
    },
    media: [
      {
        type: 'COVER',
        alt: 'Green Terrace',
        media: {
          url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
        },
      },
    ],
    menus: [
      {
        id: 'menu-gt-1',
        name: 'Plant-Based Bowls',
        description: 'Healthy and wholesome organic dishes',
        categories: [
          {
            id: 'cat-gt-bowls',
            name: 'Nourish Bowls',
            description: 'Vibrant whole foods, supergrains, and homemade tahini-herb dressings.',
            items: [
              {
                id: 'item-gt-1',
                name: 'Avocado Green Goddess Bowl',
                description: 'Quinoa, Hass avocado, edamame, roasted kale, cucumber ribbons, sunflower sprouts, green herb dressing.',
                basePrice: '14.80',
                preparationTime: 12,
                calories: 440,
                isFeatured: true,
                media: [
                  {
                    alt: 'Green Goddess Bowl',
                    media: {
                      url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [],
                addOnGroups: [],
              },
            ],
          },
        ],
      },
    ],
  },
  'la-brasa': {
    id: 'la-brasa',
    name: 'La Brasa',
    slug: 'la-brasa',
    description: 'Charcoal-grilled Argentinian grass-fed steaks, homemade chimichurri, and empanadas.',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    settings: {
      estimatedPrepMinutes: 40,
      minimumOrder: '18.00',
      deliveryFee: '2.49',
      serviceFee: '0.99',
      taxRate: '0.14',
    },
    media: [
      {
        type: 'COVER',
        alt: 'La Brasa',
        media: {
          url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
        },
      },
    ],
    menus: [
      {
        id: 'menu-lb-1',
        name: 'Asado Grill',
        description: 'Prime cuts grilled over open charcoal',
        categories: [
          {
            id: 'cat-lb-steaks',
            name: 'From the Parrilla Grill',
            description: 'Seared over aromatic birch and charcoal embers.',
            items: [
              {
                id: 'item-lb-1',
                name: 'Argentinian Ribeye Steak (300g)',
                description: 'Prime cut grass-fed ribeye, grilled to your preference, served with house chimichurri and sea salt.',
                basePrice: '32.00',
                preparationTime: 25,
                calories: 780,
                isFeatured: true,
                media: [
                  {
                    alt: 'Ribeye Steak',
                    media: {
                      url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
                      width: 600,
                      height: 400,
                    },
                  },
                ],
                variants: [
                  {
                    id: 'var-doneness',
                    name: 'Cooking Temperature',
                    options: [
                      { id: 'opt-med-rare', name: 'Medium Rare', priceAdjustment: '0.00' },
                      { id: 'opt-med', name: 'Medium', priceAdjustment: '0.00' },
                      { id: 'opt-med-well', name: 'Medium Well', priceAdjustment: '0.00' },
                    ],
                  },
                ],
                addOnGroups: [],
              },
            ],
          },
        ],
      },
    ],
  },
};

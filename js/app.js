/* ============================================================
   GREEN LIFE FLOWERS — MAIN APP
   Handles: product data, product rendering, shop logic
   ============================================================ */

/* ── Tier Pricing System ──
   Each product can have a `tiers` array: [{min, price}]
   sorted ascending by min. The first tier is the base price.
   If no tiers, the flat `price` is used. */

/* Helper: get the price for a given quantity */
function getTierPrice(product, qty) {
  if (!product.tiers || product.tiers.length === 0) return product.price;
  let best = product.tiers[0].price;
  for (const tier of product.tiers) {
    if (qty >= tier.min) best = tier.price;
  }
  return best;
}

/* Helper: get the lowest possible tier price */
function getLowestTierPrice(product) {
  if (!product.tiers || product.tiers.length === 0) return null;
  return product.tiers[product.tiers.length - 1].price;
}

/* Helper: format price for display */
function formatPrice(price) {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`;
}

/* ── Product Catalog ── */
const PRODUCTS = [
  /* ──────── ROSES ──────── */
  {
    id: 'rose-001',
    name: 'Classic Red Roses',
    category: 'roses',
    price: 45,
    unit: 'per dozen',
    tiers: [{min: 1, price: 45}, {min: 10, price: 38}, {min: 25, price: 32}],
    description: 'Timeless velvety red roses with a rich fragrance. Long-stemmed premium grade, perfect for grand arrangements.',
    image: 'flowers/Screenshot 2026-03-12 000052.png',
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
  },
  {
    id: 'rose-002',
    name: 'Garden White Roses',
    category: 'roses',
    price: 38,
    unit: 'per dozen',
    tiers: [{min: 1, price: 38}, {min: 10, price: 32}, {min: 25, price: 27}],
    description: 'Pure ivory petals with a soft, delicate fragrance. Favoured for weddings and elegant bridal styling.',
    image: 'flowers/Screenshot 2026-03-12 023603.png',
    badge: null,
  },
  {
    id: 'rose-003',
    name: 'Blush Pink Roses',
    category: 'roses',
    price: 42,
    unit: 'per dozen',
    tiers: [{min: 1, price: 42}, {min: 10, price: 36}, {min: 25, price: 30}],
    description: 'Soft romantic blush tones that evoke warmth and tenderness. A perennial florist favourite.',
    image: 'flowers/Screenshot 2026-03-12 000228.png',
    badge: 'Popular',
    badgeClass: 'badge-popular',
  },

  /* ──────── ROSES — WHOLESALE BUNCH (25 STEMS) ──────── */
  {
    id: 'rose-spray-001',
    name: 'Spray Roses',
    category: 'roses',
    price: 14.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 14.50}, {min: 10, price: 12.50}, {min: 25, price: 10.50}],
    description: 'Delicate multi-headed spray roses with abundant small blooms, ideal for filling arrangements and adding texture.',
    image: 'flowers/Screenshot 2026-03-12 003753.png',
    badge: null,
  },
  {
    id: 'rose-spray-002',
    name: 'Spray Roses (Mixed)',
    category: 'roses',
    price: 15.75,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 15.75}, {min: 10, price: 13.50}, {min: 25, price: 11.50}],
    description: 'Vibrant assorted spray roses in a cheerful mix of colours, perfect for eclectic bouquets and event décor.',
    image: 'flowers/Screenshot 2026-03-12 000437.png',
    badge: null,
  },
  {
    id: 'rose-garden-001',
    name: 'Garden Roses',
    category: 'roses',
    price: 32.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 32.00}, {min: 10, price: 27.00}, {min: 25, price: 23.00}],
    description: 'Lush, peony-style garden roses with layered ruffled petals and an intoxicating fragrance. A bridal favourite.',
    image: 'flowers/Screenshot 2026-03-12 000527.png',
    badge: 'Premium',
    badgeClass: 'badge-premium',
  },
  {
    id: 'rose-red-001',
    name: 'Red Roses',
    category: 'roses',
    price: 16.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 16.50}, {min: 10, price: 14.00}, {min: 25, price: 12.00}],
    description: 'Classic long-stemmed red roses — the timeless symbol of love and passion. Rich colour, strong stems.',
    image: 'flowers/Screenshot 2026-03-12 000052.png',
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
  },
  {
    id: 'rose-freedom-001',
    name: 'Freedom Explorer Roses',
    category: 'roses',
    price: 18.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 18.50}, {min: 10, price: 15.50}, {min: 25, price: 13.50}],
    description: 'Premium deep red Freedom Explorer roses known for large blooms and long stems, perfect for luxury floral arrangements.',
    image: 'flowers/Screenshot 2026-03-12 004321.png',
    badge: null,
  },
  {
    id: 'rose-white-001',
    name: 'White Roses',
    category: 'roses',
    price: 15.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 15.00}, {min: 10, price: 12.75}, {min: 25, price: 11.00}],
    description: 'Pure pristine white roses symbolising elegance and new beginnings. A staple for weddings and sympathy work.',
    image: 'flowers/Screenshot 2026-03-12 000143.png',
    badge: null,
  },
  {
    id: 'rose-mundial-001',
    name: 'Mundial Roses',
    category: 'roses',
    price: 17.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 17.00}, {min: 10, price: 14.50}, {min: 25, price: 12.50}],
    description: 'Premium white Mundial roses with large, high-centred blooms and exceptional vase life. Industry gold standard.',
    image: 'flowers/Screenshot 2026-03-12 001155.png',
    badge: null,
  },
  {
    id: 'rose-playablanca-001',
    name: 'Playa Blanca Roses',
    category: 'roses',
    price: 18.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 18.00}, {min: 10, price: 15.50}, {min: 25, price: 13.00}],
    description: 'Stunning creamy-white Playa Blanca roses with a classic spiral bloom shape. Elegant and long-lasting.',
    image: 'flowers/Screenshot 2026-03-12 000315.png',
    badge: null,
  },
  {
    id: 'rose-mandela-001',
    name: 'Mandela Roses',
    category: 'roses',
    price: 19.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 19.50}, {min: 10, price: 16.50}, {min: 25, price: 14.50}],
    description: 'Bold, velvety red Mandela roses with superior head size and striking dark-red tones. A top-tier exhibition rose.',
    image: 'flowers/Screenshot 2026-03-12 004321.png',
    badge: null,
  },
  {
    id: 'rose-proud-001',
    name: 'Proud Roses',
    category: 'roses',
    price: 20.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 20.00}, {min: 10, price: 17.00}, {min: 25, price: 15.00}],
    description: 'Luxurious ivory-cream Proud roses with voluminous heads and a subtle blush edge. Perfect for high-end events.',
    image: 'flowers/Screenshot 2026-03-12 000315.png',
    badge: 'Luxury',
    badgeClass: 'badge-luxury',
  },
  {
    id: 'rose-yellow-001',
    name: 'Yellow Roses',
    category: 'roses',
    price: 15.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 15.50}, {min: 10, price: 13.00}, {min: 25, price: 11.00}],
    description: 'Bright sunshine-yellow roses that radiate warmth and joy. Symbolising friendship and happiness.',
    image: 'flowers/Screenshot 2026-03-12 001317.png',
    badge: null,
  },
  {
    id: 'rose-brighton-001',
    name: 'Brighton Roses',
    category: 'roses',
    price: 16.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 16.00}, {min: 10, price: 13.50}, {min: 25, price: 11.50}],
    description: 'Cheerful golden-yellow Brighton roses with strong stems and a generous bloom. Reliable and radiant.',
    image: 'flowers/Screenshot 2026-03-12 001345.png',
    badge: null,
  },
  {
    id: 'rose-highyellow-001',
    name: 'High-End Yellow Roses',
    category: 'roses',
    price: 22.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 22.00}, {min: 10, price: 18.50}, {min: 25, price: 16.00}],
    description: 'Premium select yellow roses with oversized heads and vivid saturated colour. Designed for luxury presentations.',
    image: 'flowers/Screenshot 2026-03-12 001645.png',
    badge: 'Premium',
    badgeClass: 'badge-premium',
  },
  {
    id: 'rose-lightpink-001',
    name: 'Light Pink Roses',
    category: 'roses',
    price: 15.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 15.50}, {min: 10, price: 13.00}, {min: 25, price: 11.00}],
    description: 'Soft pastel pink roses exuding grace and sweetness. A go-to for romantic bouquets and baby showers.',
    image: 'flowers/Screenshot 2026-03-12 001736.png',
    badge: null,
  },
  {
    id: 'rose-hermosa-001',
    name: 'Hermosa Roses',
    category: 'roses',
    price: 17.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 17.50}, {min: 10, price: 15.00}, {min: 25, price: 12.50}],
    description: 'Elegant Hermosa roses in a delicate blush-pink with perfectly formed spiral centres. Exquisitely feminine.',
    image: 'flowers/Screenshot 2026-03-12 002037.png',
    badge: null,
  },
  {
    id: 'rose-luciano-001',
    name: 'Luciano Roses',
    category: 'roses',
    price: 18.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 18.00}, {min: 10, price: 15.50}, {min: 25, price: 13.00}],
    description: 'Refined Luciano roses in warm dusty-pink tones with excellent petal count and a sophisticated vintage feel.',
    image: 'flowers/Screenshot 2026-03-12 002019.png',
    badge: null,
  },
  {
    id: 'rose-fruttetto-001',
    name: 'Fruttetto Roses',
    category: 'roses',
    price: 19.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 19.00}, {min: 10, price: 16.00}, {min: 25, price: 14.00}],
    description: 'Unique bi-colour Fruttetto roses blending peachy-pink and cream. A trendy choice for modern rustic designs.',
    image: 'flowers/Screenshot 2026-03-12 002119.png',
    badge: null,
  },
  {
    id: 'rose-besweet-001',
    name: 'Be Sweet Roses',
    category: 'roses',
    price: 17.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 17.00}, {min: 10, price: 14.50}, {min: 25, price: 12.50}],
    description: 'Charming Be Sweet roses in candy-pink with a gentle fragrance. Compact heads ideal for mixed arrangements.',
    image: 'flowers/Screenshot 2026-03-12 002153.png',
    badge: null,
  },
  {
    id: 'rose-pinkmundial-001',
    name: 'Pink Mundial Roses',
    category: 'roses',
    price: 17.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 17.50}, {min: 10, price: 15.00}, {min: 25, price: 12.50}],
    description: 'The pink sister of the Mundial — same premium quality and vase life in a gorgeous medium-pink hue.',
    image: 'flowers/Screenshot 2026-03-12 001122.png',
    badge: null,
  },
  {
    id: 'rose-hotpink-001',
    name: 'Hot Pink Roses',
    category: 'roses',
    price: 16.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 16.50}, {min: 10, price: 14.00}, {min: 25, price: 12.00}],
    description: 'Vivid, electric hot-pink roses that make a bold statement. Eye-catching and full of energy.',
    image: 'flowers/Screenshot 2026-03-12 002337.png',
    badge: 'Popular',
    badgeClass: 'badge-popular',
  },
  {
    id: 'rose-pinkfloyd-001',
    name: 'Pink Floyd Roses',
    category: 'roses',
    price: 19.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 19.00}, {min: 10, price: 16.00}, {min: 25, price: 14.00}],
    description: 'Iconic large-headed Pink Floyd roses in vibrant magenta-pink. A florist favourite for show-stopping centrepieces.',
    image: 'flowers/Screenshot 2026-03-12 002447.png',
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
  },
  {
    id: 'rose-purple-001',
    name: 'Purple Roses',
    category: 'roses',
    price: 18.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 18.00}, {min: 10, price: 15.50}, {min: 25, price: 13.00}],
    description: 'Mysterious and regal purple roses that add drama and sophistication to any arrangement.',
    image: 'flowers/Screenshot 2026-03-12 002601.png',
    badge: null,
  },
  {
    id: 'rose-oceansong-001',
    name: 'Deep Purple Ocean Song Roses',
    category: 'roses',
    price: 21.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 21.00}, {min: 10, price: 18.00}, {min: 25, price: 15.50}],
    description: 'Exquisite Ocean Song roses in deep lavender-purple with a silvery sheen. Romantic, unique, and highly sought-after.',
    image: 'flowers/Screenshot 2026-03-12 002651.png',
    badge: 'Premium',
    badgeClass: 'badge-premium',
  },
  {
    id: 'rose-violet-001',
    name: 'Violet Roses',
    category: 'roses',
    price: 19.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 19.50}, {min: 10, price: 16.50}, {min: 25, price: 14.50}],
    description: 'Enchanting violet-hued roses with a velvety texture. A rare and captivating addition to luxury bouquets.',
    image: 'flowers/Screenshot 2026-03-12 002818.png',
    badge: null,
  },
  {
    id: 'rose-orange-001',
    name: 'Orange Roses',
    category: 'roses',
    price: 15.50,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 15.50}, {min: 10, price: 13.00}, {min: 25, price: 11.00}],
    description: 'Warm, sunset-orange roses bursting with enthusiasm and warmth. Symbolising desire and excitement.',
    image: 'flowers/Screenshot 2026-03-12 002953.png',
    badge: null,
  },
  {
    id: 'rose-orangecrush-001',
    name: 'Orange Crush Roses',
    category: 'roses',
    price: 17.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 17.00}, {min: 10, price: 14.50}, {min: 25, price: 12.50}],
    description: 'Bright tangerine Orange Crush roses with a playful, citrusy vibe. Fantastic for summer events and tropical themes.',
    image: 'flowers/Screenshot 2026-03-12 002953.png',
    badge: null,
  },
  {
    id: 'rose-highmagic-001',
    name: 'High Magic Roses',
    category: 'roses',
    price: 20.00,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 20.00}, {min: 10, price: 17.00}, {min: 25, price: 14.50}],
    description: 'Striking bi-colour High Magic roses blending fiery orange and golden yellow. A showpiece that commands attention.',
    image: 'flowers/Screenshot 2026-03-12 003038.png',
    badge: 'Premium',
    badgeClass: 'badge-premium',
  },

  /* ──────── LILIES ──────── */
  {
    id: 'lily-001',
    name: 'Stargazer Lilies',
    category: 'lilies',
    price: 28,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 28}, {min: 10, price: 24}, {min: 25, price: 20}],
    description: 'Stunning pink Stargazer lilies with bold speckled petals and an intoxicating fragrance. A florist staple.',
    image: 'flowers/Screenshot 2026-03-12 004605.png',
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
  },
  {
    id: 'lily-002',
    name: 'White Oriental Lilies',
    category: 'lilies',
    price: 32,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 32}, {min: 10, price: 27}, {min: 25, price: 23}],
    description: 'Pristine white Oriental lilies with large, fragrant blooms. Elegant for weddings and sympathy work.',
    image: 'flowers/Screenshot 2026-03-12 003217.png',
    badge: 'Premium',
    badgeClass: 'badge-premium',
  },
  {
    id: 'lily-003',
    name: 'Asiatic Lilies (Mixed)',
    category: 'lilies',
    price: 22,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 22}, {min: 10, price: 18}, {min: 25, price: 15}],
    description: 'Vibrant Asiatic lilies in a cheerful colour mix — orange, yellow, and pink. Long-lasting and versatile.',
    image: 'flowers/Screenshot 2026-03-12 004605.png',
    badge: null,
  },

  /* ──────── SUNFLOWERS ──────── */
  {
    id: 'sunflower-001',
    name: 'Golden Sunflowers',
    category: 'sunflowers',
    price: 18,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 18}, {min: 10, price: 15}, {min: 25, price: 12}],
    description: 'Radiant, sun-kissed sunflowers that bring warmth and joy to any space or celebration.',
    image: 'flowers/Screenshot 2026-03-12 003355.png',
    badge: 'Popular',
    badgeClass: 'badge-popular',
  },
  {
    id: 'sunflower-002',
    name: 'Teddy Bear Sunflowers',
    category: 'sunflowers',
    price: 22,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 22}, {min: 10, price: 18}, {min: 25, price: 15}],
    description: 'Fluffy, fully double Teddy Bear sunflowers with a unique pom-pom texture. Compact and charming.',
    image: 'flowers/Screenshot 2026-03-12 003355.png',
    badge: null,
  },
  {
    id: 'sunflower-003',
    name: 'Sunflower Stems (Wholesale)',
    category: 'sunflowers',
    price: 34,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 34}, {min: 10, price: 29}, {min: 25, price: 25}],
    description: 'Premium grade large-headed sunflowers, ideal for bulk floral arrangements and event decor.',
    image: 'flowers/Screenshot 2026-03-12 003355.png',
    badge: null,
  },

  /* ──────── CHRYSANTHEMUMS ──────── */
  {
    id: 'chrys-001',
    name: 'White Chrysanthemums',
    category: 'chrysanthemums',
    price: 12,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 12}, {min: 10, price: 10}, {min: 25, price: 8}],
    description: 'Classic white chrysanthemums with full, round heads. A dependable workhorse for everyday arrangements.',
    image: 'flowers/Screenshot 2026-03-12 003514.png',
    badge: null,
  },
  {
    id: 'chrys-002',
    name: 'Yellow Chrysanthemums',
    category: 'chrysanthemums',
    price: 12,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 12}, {min: 10, price: 10}, {min: 25, price: 8}],
    description: 'Bright golden chrysanthemums that add sunshine and volume to bouquets and sympathy tributes.',
    image: 'flowers/Screenshot 2026-03-12 003514.png',
    badge: null,
  },
  {
    id: 'chrys-003',
    name: 'Spider Chrysanthemums',
    category: 'chrysanthemums',
    price: 16,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 16}, {min: 10, price: 13}, {min: 25, price: 11}],
    description: 'Exotic spider-form chrysanthemums with long, curling petals. Dramatic and eye-catching.',
    image: 'flowers/Screenshot 2026-03-12 003514.png',
    badge: 'Popular',
    badgeClass: 'badge-popular',
  },

  /* ──────── POM POM ──────── */
  {
    id: 'pompom-001',
    name: 'White Pom Poms',
    category: 'pom pom',
    price: 10,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 10}, {min: 10, price: 8.50}, {min: 25, price: 7}],
    description: 'Round, button-like white pom pom chrysanthemums. Perfect for fillers and hand-tied bouquets.',
    image: 'flowers/Screenshot 2026-03-12 003753.png',
    badge: null,
  },
  {
    id: 'pompom-002',
    name: 'Mixed Pom Poms',
    category: 'pom pom',
    price: 12,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 12}, {min: 10, price: 10}, {min: 25, price: 8.50}],
    description: 'Cheerful assortment of colourful pom pom blooms in pink, yellow, and white. Fun and versatile.',
    image: 'flowers/Screenshot 2026-03-12 000709.png',
    badge: null,
  },
  {
    id: 'pompom-003',
    name: 'Green Pom Poms',
    category: 'pom pom',
    price: 14,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 14}, {min: 10, price: 12}, {min: 25, price: 10}],
    description: 'Fresh lime-green pom pom blooms that add texture and a modern twist to any arrangement.',
    image: 'flowers/Screenshot 2026-03-12 003753.png',
    badge: null,
  },

  /* ──────── CARNATION ──────── */
  {
    id: 'carnation-001',
    name: 'Red Carnations',
    category: 'carnation',
    price: 8,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 8}, {min: 10, price: 6.50}, {min: 25, price: 5.50}],
    description: 'Classic red carnations — long-lasting, vibrant, and the backbone of wholesale floristry.',
    image: 'flowers/Screenshot 2026-03-12 003956.png',
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
  },
  {
    id: 'carnation-002',
    name: 'White Carnations',
    category: 'carnation',
    price: 8,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 8}, {min: 10, price: 6.50}, {min: 25, price: 5.50}],
    description: 'Pure white carnations — versatile, durable, and ideal for sympathy work, weddings, and dyeing.',
    image: 'flowers/Screenshot 2026-03-12 004049.png',
    badge: null,
  },
  {
    id: 'carnation-003',
    name: 'Pink Carnations',
    category: 'carnation',
    price: 8,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 8}, {min: 10, price: 6.50}, {min: 25, price: 5.50}],
    description: 'Soft pink carnations symbolising gratitude and love. A reliable florist favourite with superb vase life.',
    image: 'flowers/Screenshot 2026-03-12 003956.png',
    badge: null,
  },

  /* ──────── MINI CARNATION ──────── */
  {
    id: 'minicarn-001',
    name: 'White Mini Carnations',
    category: 'mini carnation',
    price: 6,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 6}, {min: 10, price: 5}, {min: 25, price: 4}],
    description: 'Delicate multi-headed white mini carnations. Excellent filler for bouquets and corsages.',
    image: 'flowers/Screenshot 2026-03-12 004049.png',
    badge: null,
  },
  {
    id: 'minicarn-002',
    name: 'Mixed Mini Carnations',
    category: 'mini carnation',
    price: 6,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 6}, {min: 10, price: 5}, {min: 25, price: 4}],
    description: 'Colourful assorted mini carnations in vibrant hues. Budget-friendly and cheerful.',
    image: 'flowers/Screenshot 2026-03-12 003956.png',
    badge: 'Popular',
    badgeClass: 'badge-popular',
  },
  {
    id: 'minicarn-003',
    name: 'Pink Mini Carnations',
    category: 'mini carnation',
    price: 6,
    unit: 'per bunch (25 stems)',
    tiers: [{min: 1, price: 6}, {min: 10, price: 5}, {min: 25, price: 4}],
    description: 'Sweet pink spray carnations with multiple blooms per stem. Great volume at an affordable price.',
    image: 'flowers/Screenshot 2026-03-12 004049.png',
    badge: null,
  },

  /* ──────── SOLIDAGO ──────── */
  {
    id: 'solidago-001',
    name: 'Solidago (Goldenrod)',
    category: 'solidago',
    price: 10,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 10}, {min: 10, price: 8.50}, {min: 25, price: 7}],
    description: 'Bright yellow solidago sprays that add texture, colour, and wild-flower charm to mixed arrangements.',
    image: 'flowers/Screenshot 2026-03-12 004123.png',
    badge: null,
  },
  {
    id: 'solidago-002',
    name: 'Solidago Tara',
    category: 'solidago',
    price: 12,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 12}, {min: 10, price: 10}, {min: 25, price: 8.50}],
    description: 'Premium Tara solidago with dense, golden plumes. A favourite filler for rustic and country-style designs.',
    image: 'flowers/Screenshot 2026-03-12 004123.png',
    badge: null,
  },

  /* ──────── BABY'S BREATH ──────── */
  {
    id: 'babysbreath-001',
    name: "Baby's Breath (Gypsophila)",
    category: "baby's breath",
    price: 14,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 14}, {min: 10, price: 12}, {min: 25, price: 10}],
    description: "Classic white baby's breath — airy, delicate clouds of tiny blooms. The quintessential filler flower.",
    image: 'flowers/Screenshot 2026-03-12 004202.png',
    badge: 'Bestseller',
    badgeClass: 'badge-bestseller',
  },
  {
    id: 'babysbreath-002',
    name: "Baby's Breath (Xlence)",
    category: "baby's breath",
    price: 18,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 18}, {min: 10, price: 15}, {min: 25, price: 12}],
    description: "Premium Xlence variety with larger, denser bloom clusters. Superior quality for wedding and event work.",
    image: 'flowers/Screenshot 2026-03-12 004202.png',
    badge: 'Premium',
    badgeClass: 'badge-premium',
  },
  {
    id: 'babysbreath-003',
    name: "Tinted Baby's Breath",
    category: "baby's breath",
    price: 20,
    unit: 'per bunch (10 stems)',
    tiers: [{min: 1, price: 20}, {min: 10, price: 17}, {min: 25, price: 14}],
    description: "Delicately tinted baby's breath in soft pastels — blush, lavender, and sky blue. Perfect for themed events.",
    image: 'flowers/Screenshot 2026-03-12 004202.png',
    badge: null,
  },
];

/* ── Category labels — derived from FlowerList (single source of truth) ── */
/* FlowerList.getVisible() returns the canonical list at runtime.
   This helper maps a display name to the product-level category key. */

/* ── Unified product store key ── */
const PRODUCT_STORE_KEY = 'greenlife_products';
const PRODUCT_STORE_VERSION_KEY = 'greenlife_products_version';
const PRODUCT_STORE_VERSION = '8'; // bump this whenever default product images/data change

/* ── Initialize store on first load (migrate defaults + any existing custom products) ── */
function initProductStore() {
  const storedVersion = localStorage.getItem(PRODUCT_STORE_VERSION_KEY);
  const hasStore = localStorage.getItem(PRODUCT_STORE_KEY);

  // If version matches, nothing to do
  if (hasStore && storedVersion === PRODUCT_STORE_VERSION) return;

  // Build fresh defaults
  const defaultIds = new Set(PRODUCTS.map(p => p.id));
  const all = [...PRODUCTS];

  try {
    // Preserve any custom (admin-added) products that aren't in the defaults
    if (hasStore) {
      const oldProducts = JSON.parse(hasStore);
      const customOnly = oldProducts.filter(p => !defaultIds.has(p.id));
      all.push(...customOnly);
    } else {
      // First ever load — migrate legacy custom products if present
      const customRaw = localStorage.getItem('greenlife_custom_products');
      if (customRaw) all.push(...JSON.parse(customRaw));
    }
  } catch {}

  localStorage.setItem(PRODUCT_STORE_KEY, JSON.stringify(all));
  localStorage.setItem(PRODUCT_STORE_VERSION_KEY, PRODUCT_STORE_VERSION);
}

/* ── Get all products from unified store ── */
function getAllProducts() {
  try {
    initProductStore();
    const raw = localStorage.getItem(PRODUCT_STORE_KEY);
    return raw ? JSON.parse(raw) : [...PRODUCTS];
  } catch { return [...PRODUCTS]; }
}

/* ── Save all products to unified store and re-render shop ── */
function saveAllProducts(products) {
  localStorage.setItem(PRODUCT_STORE_KEY, JSON.stringify(products));
  if (document.getElementById('productsGrid')) {
    const pillContainer = document.getElementById('flowerCategoryPills');
    const activePill = pillContainer && pillContainer.querySelector('.category-pill.active');
    const filter = activePill ? getCategoryFilter(activePill.dataset.flowerCategory) : 'roses';
    renderProducts(filter);
  }
}

/* ── Render products into grid ── */
function renderProducts(filter = 'all') {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const all = getAllProducts();
  const filtered = filter === 'all'
    ? all
    : all.filter(p => p.category === filter);

  grid.innerHTML = filtered.map(product => renderProductCard(product)).join('');

  // Re-init scroll reveal for new cards
  if (typeof Animations !== 'undefined') {
    Animations.initScrollReveal();
  }
}

/* ── Build a product card HTML string ── */
function renderProductCard(product) {
  const badge = product.badge
    ? `<span class="product-card-badge ${product.badgeClass || ''}">${product.badge}</span>`
    : '';

  // Capitalise the stored category key for display (e.g. 'pom pom' → 'Pom Pom')
  const catLabel = (product.category || '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Tier pricing info
  const hasTiers = product.tiers && product.tiers.length > 1;
  const lowestPrice = hasTiers ? getLowestTierPrice(product) : null;
  const savingsPercent = hasTiers ? Math.round((1 - lowestPrice / product.price) * 100) : 0;

  // Build tier rows for the expandable table
  let tierTableHTML = '';
  if (hasTiers) {
    const tierRows = product.tiers.map((tier, i) => {
      const isLast = i === product.tiers.length - 1;
      const maxLabel = isLast ? '+' : `–${product.tiers[i + 1].min - 1}`;
      const saving = i > 0 ? Math.round((1 - tier.price / product.tiers[0].price) * 100) : 0;
      const saveBadge = saving > 0 ? `<span class="tier-save-badge">Save ${saving}%</span>` : '';
      return `
        <tr class="tier-row ${i === 0 ? 'tier-row-base' : ''}">
          <td class="tier-qty">${tier.min}${maxLabel}</td>
          <td class="tier-price">${formatPrice(tier.price)}</td>
          <td class="tier-save">${saveBadge}</td>
        </tr>`;
    }).join('');

    tierTableHTML = `
      <div class="tier-pricing-section">
        <button class="tier-toggle-btn" data-tier-toggle="${product.id}" aria-expanded="false">
          <span class="tier-toggle-label">
            <svg class="tier-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/>
            </svg>
            Volume pricing
          </span>
          <span class="tier-toggle-hint">Up to ${savingsPercent}% off</span>
          <svg class="tier-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="tier-table-wrap" id="tierTable-${product.id}">
          <table class="tier-table">
            <thead>
              <tr><th>Qty</th><th>Price</th><th></th></tr>
            </thead>
            <tbody>${tierRows}</tbody>
          </table>
        </div>
      </div>`;
  }

  // "As low as" label
  const asLowAs = hasTiers
    ? `<span class="product-card-as-low-as">As low as ${formatPrice(lowestPrice)}</span>`
    : '';

  return `
    <article class="product-card reveal stagger-item" data-product-id="${product.id}" data-category="${product.category}">
      <div class="product-card-image-wrap">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          onerror="this.onerror=null;this.style.display='none';"
        />
        ${badge}
        <div class="product-card-overlay"></div>
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${catLabel}</div>
        <h3 class="product-card-name">${product.name}</h3>
        <p class="product-card-desc">${product.description}</p>
        ${tierTableHTML}
        <div class="product-card-footer">
          <div class="product-card-pricing">
            <span class="product-card-price">${formatPrice(product.price)}</span>
            <span class="product-card-unit">${product.unit}</span>
            ${asLowAs}
          </div>
          <div class="product-card-add">
            <div class="qty-control">
              <button class="qty-btn" data-product-dec="${product.id}" aria-label="Decrease quantity">−</button>
              <input
                class="qty-input"
                type="number"
                id="qty-${product.id}"
                value="1"
                min="1"
                max="999"
                aria-label="Quantity for ${product.name}"
              />
              <button class="qty-btn" data-product-inc="${product.id}" aria-label="Increase quantity">+</button>
            </div>
            <button
              class="add-to-cart-btn"
              data-add-to-cart="${product.id}"
              aria-label="Add ${product.name} to cart"
              title="Add to cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="delivery-notice-card">
          <div class="delivery-notice-card-line">
            <span style="flex-shrink:0">📍</span>
            <span>We currently deliver only within the San Francisco Bay Area (San Jose, Richmond, Concord, and surrounding cities).</span>
          </div>
          <div class="delivery-notice-card-line delivery-notice-card-warning">
            <span style="flex-shrink:0">🚫</span>
            <span>If you are outside this area, please contact us before placing an order.</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

/* ── Qty controls for product cards ── */
function bindProductControls() {
  // Tier toggle
  document.addEventListener('click', e => {
    const toggle = e.target.closest('[data-tier-toggle]');
    if (!toggle) return;
    const id = toggle.dataset.tierToggle;
    const wrap = document.getElementById(`tierTable-${id}`);
    if (!wrap) return;
    const isOpen = wrap.classList.contains('open');
    wrap.classList.toggle('open');
    toggle.setAttribute('aria-expanded', !isOpen);
    toggle.classList.toggle('active');
  });

  document.addEventListener('click', e => {
    // Increment
    const incBtn = e.target.closest('[data-product-inc]');
    if (incBtn) {
      const input = document.getElementById(`qty-${incBtn.dataset.productInc}`);
      if (input) {
        const val = Math.min(parseInt(input.value || 1) + 1, 999);
        input.value = val;
      }
    }

    // Decrement
    const decBtn = e.target.closest('[data-product-dec]');
    if (decBtn) {
      const input = document.getElementById(`qty-${decBtn.dataset.productDec}`);
      if (input) {
        const val = Math.max(parseInt(input.value || 1) - 1, 1);
        input.value = val;
      }
    }

    // Add to cart
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      const id = addBtn.dataset.addToCart;
      const product = getAllProducts().find(p => p.id === id);
      if (!product) return;

      const qtyInput = document.getElementById(`qty-${id}`);
      const qty = qtyInput ? Math.max(1, Math.min(parseInt(qtyInput.value || 1), 999)) : 1;

      Cart.add(product, qty);

      // Visual feedback
      addBtn.classList.add('success');
      addBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `;
      setTimeout(() => {
        addBtn.classList.remove('success');
        addBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        `;
      }, 1600);

      // Reset qty
      if (qtyInput) qtyInput.value = 1;
    }
  });
}

/* ── Product lookup helper ── */
function getProductById(id) {
  return getAllProducts().find(p => p.id === id) || null;
}

/* ── Map category display name → product filter key ── */
/* Products store category as lowercase name (e.g. 'roses', 'pom pom', "baby's breath").
   The FlowerList pill dispatches the display name (e.g. 'Roses', 'Pom Pom').
   We simply lowercase it to match the product field. */
function getCategoryFilter(displayName) {
  return displayName.toLowerCase();
}

/* ── Init shop ── */
function initShop() {
  // Render unified category pills from FlowerList
  if (typeof FlowerList !== 'undefined') FlowerList.renderPanel();

  // Render products — default to roses
  renderProducts('roses');
  bindProductControls();

  // Listen for category pill clicks
  document.addEventListener('flower-category-change', e => {
    const name = e.detail.category;
    renderProducts(getCategoryFilter(name));
  });
}

/* ── DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  // Init cart
  if (typeof Cart !== 'undefined') Cart.init();

  // Init animations
  if (typeof Animations !== 'undefined') Animations.init();

  // Init shop (only if grid exists)
  if (document.getElementById('productsGrid')) initShop();
});

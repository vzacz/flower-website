/* ============================================================
   GREEN LIFE FLOWERS — ABOUT SECTION CONTENT MANAGER
   Stores and retrieves editable About page content via localStorage.
   ============================================================ */

const AboutContent = (function () {
  'use strict';

  const STORAGE_KEY = 'greenlife_about';

  const DEFAULTS = {
    sectionLabel: 'Our Story',
    heading: 'Why Ecuador Grows the World\'s Best Flowers',
    paragraph1: 'Ecuador is widely known as one of the best places in the world to grow flowers, especially roses. The country\'s unique geography and climate create the perfect conditions for producing flowers with exceptional beauty, strength, and color.',
    paragraph2: 'Because Ecuador sits directly on the equator, flower farms receive nearly <strong>12 hours of sunlight every day year-round</strong>. This consistent sunlight allows flowers to grow slowly and naturally, producing <strong>larger blooms, stronger stems, and richer colors</strong>.',
    paragraph3: 'Many Ecuadorian flower farms are also located <strong>high in the Andes Mountains</strong>, often more than <strong>9,000 feet above sea level</strong>. The cool mountain air combined with strong sunlight helps flowers develop <strong>thicker stems and longer-lasting petals</strong>, making them perfect for bouquets and arrangements.',
    paragraph4: 'Ecuadorian roses are recognized around the world for their <strong>large flower heads, vibrant colors, and exceptional freshness</strong>. Because of these natural advantages, many of the world\'s top florists and flower markets choose Ecuadorian flowers.',
    image1: 'flowers/Screenshot 2026-03-12 001317.png',
    image1Alt: 'Premium Ecuadorian roses in full bloom',
    image2: 'flowers/Screenshot 2026-03-12 003355.png',
    image2Alt: 'Flower farms in the Andes Mountains of Ecuador',
  };

  function getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults so new fields are always present
        return Object.assign({}, DEFAULTS, parsed);
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, DEFAULTS);
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { getAll, save, reset, DEFAULTS };
})();

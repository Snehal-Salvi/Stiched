// Cover photos shown on tailor cards and at the top of the detail page
const SHOP_PHOTOS = {
  "Women's Wear": [
    '/tailor_images/womens-1.jpg',
    '/tailor_images/womens-2.jpg',
    '/tailor_images/womens-3.jpg',
    '/tailor_images/womens-4.jpg',
    '/tailor_images/womens-5.jpg',
  ],
  "Men's Wear": [
    '/tailor_images/mens-1.jpg',
    '/tailor_images/mens-2.jpg',
    '/tailor_images/mens-3.jpg',
    '/tailor_images/mens-4.jpg',
    '/tailor_images/mens-5.jpg',
  ],
  "Kids' Wear": [
    '/tailor_images/kids-1.jpg',
    '/tailor_images/kids-2.jpg',
    '/tailor_images/kids-3.jpg',
    '/tailor_images/kids-4.jpg',
    '/tailor_images/kids-5.jpg',
  ],
  Alterations: [
    '/tailor_images/alterations-1.jpg',
    '/tailor_images/alterations-2.jpg',
    '/tailor_images/alterations-3.jpg',
    '/tailor_images/alterations-4.jpg',
    '/tailor_images/alterations-5.jpg',
  ],
  Embroidery: [
    '/tailor_images/embroidery-1.jpg',
    '/tailor_images/embroidery-2.jpg',
    '/tailor_images/embroidery-3.jpg',
    '/tailor_images/embroidery-4.jpg',
    '/tailor_images/embroidery-5.jpg',
  ],
  Other: [
    '/tailor_images/other-1.jpg',
    '/tailor_images/other-2.jpg',
    '/tailor_images/other-3.jpg',
    '/tailor_images/other-4.jpg',
    '/tailor_images/other-5.jpg',
  ],
};

// Work samples shown in the gallery on the tailor detail page (20 per category)
const WORK_SAMPLES = {
  "Women's Wear": Array.from({ length: 20 }, (_, i) => `/tailor_work_samples/womens-work-${i + 1}.jpg`),
  "Men's Wear":   Array.from({ length: 20 }, (_, i) => `/tailor_work_samples/mens-work-${i + 1}.jpg`),
  "Kids' Wear":   Array.from({ length: 20 }, (_, i) => `/tailor_work_samples/kids-work-${i + 1}.jpg`),
  Alterations:    Array.from({ length: 20 }, (_, i) => `/tailor_work_samples/alterations-work-${i + 1}.jpg`),
  Embroidery:     Array.from({ length: 20 }, (_, i) => `/tailor_work_samples/embroidery-work-${i + 1}.jpg`),
  Other:          Array.from({ length: 20 }, (_, i) => `/tailor_work_samples/other-work-${i + 1}.jpg`),
};

export { SHOP_PHOTOS, WORK_SAMPLES };


import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Tailor from './src/models/Tailor.js';
import { SHOP_PHOTOS, WORK_SAMPLES } from './seedImages.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ── Data pools ────────────────────────────────────────────────────────────────

const CITIES = [
  { city: 'Mumbai',    state: 'Maharashtra', pinBase: '400' },
  { city: 'Delhi',     state: 'Delhi',       pinBase: '110' },
  { city: 'Bengaluru', state: 'Karnataka',   pinBase: '560' },
  { city: 'Hyderabad', state: 'Telangana',   pinBase: '500' },
  { city: 'Chennai',   state: 'Tamil Nadu',  pinBase: '600' },
  { city: 'Pune',      state: 'Maharashtra', pinBase: '411' },
  { city: 'Kochi',     state: 'Kerala',      pinBase: '682' },
];

const dummySocialLinks = (shopName) => {
  const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'stichedtailor';
  return {
    instagram: `https://instagram.com/${slug}`,
    whatsapp: 'https://wa.me/1234567890',
    facebook: `https://facebook.com/${slug}`,
  };
};

const FEMALE_NAMES = [
  'Meera','Sunita','Priya','Anjali','Fatima','Lakshmi','Rekha','Sonia',
  'Deepa','Kavitha','Nandita','Pallavi','Shruti','Usha','Vandana','Yamini',
  'Asha','Bharati','Chitra','Divya','Geetha','Hema','Indira','Jaya',
  'Kamala','Lalitha','Mamta','Nirmala','Padma','Radha','Savitha','Tara',
  'Uma','Vidya','Wahida','Zubeda','Anita','Bhavana','Chandrika','Devi',
  'Eswari','Gomathi','Harini','Ishita','Jayanthi','Kalpana','Lata','Mala',
  'Nalini','Obhuli','Parimala','Qamrunnisha','Ranjita','Sudha','Thenmozhi',
  'Urvashi','Vasantha','Wajeeha','Yasmin','Zeena',
];

const MALE_NAMES = [
  'Rajesh','Mohammed','Vikram','Ramesh','Suresh','Anil','Mahesh','Ganesh',
  'Dinesh','Prakash','Naresh','Umesh','Lokesh','Yogesh','Jayesh','Sanjay',
  'Vijay','Ajay','Ravi','Mohan','Sohan','Rohan','Gopal','Murali',
  'Venkat','Krishnan','Arjun','Rahul','Rohit','Amit','Sumit','Nitin',
  'Vivek','Deepak','Alok','Manoj','Pankaj','Rakesh','Tarun','Varun',
  'Abdul','Ibrahim','Imran','Irfan','Khalid','Nasir','Omar','Salim',
  'Tariq','Yusuf','Zafar','Balaji','Chetan','Harish','Jagdish','Kamal',
  'Laxman','Narayan','Parth','Shyam','Trilok','Udayan','Wasim','Xavier',
];

const SURNAMES = [
  'Sharma','Gupta','Singh','Rao','Nair','Pillai','Iyer','Menon',
  'Shaikh','Khan','Ansari','Patel','Shah','Mehta','Joshi','Trivedi',
  'Reddy','Naidu','Murthy','Krishnan','Venkatesh','Subramanian','Agarwal',
  'Verma','Mishra','Tiwari','Pandey','Dubey','Srivastava','Shukla',
  'Desai','Patil','Kulkarni','Deshpande','Joshi','Bhosale','Jadhav',
  'Thomas','George','Mathew','Philip','Joseph','Varghese','Kurian','Antony',
];

// Services per category — 3–4 variants so tailors feel distinct
const CATEGORY_SERVICES = {
  "Women's Wear": [
    [
      { name: 'Blouse Stitching',   price: 450, days: 4 },
      { name: 'Salwar Kameez',      price: 800, days: 7 },
      { name: 'Lehenga Stitching',  price: 2200, days: 10 },
    ],
    [
      { name: 'Kurti Stitching',    price: 500, days: 4 },
      { name: 'Anarkali Suit',      price: 1200, days: 8 },
      { name: 'Churidar Suit',      price: 750, days: 6 },
    ],
    [
      { name: 'Saree Blouse',       price: 550, days: 5 },
      { name: 'Gown Stitching',     price: 1800, days: 9 },
      { name: 'Dress Stitching',    price: 900, days: 6 },
    ],
    [
      { name: 'Punjabi Suit',       price: 900, days: 6 },
      { name: 'Sharara Set',        price: 1800, days: 10 },
      { name: 'Palazzo Suit',       price: 950, days: 6 },
    ],
  ],
  "Men's Wear": [
    [
      { name: 'Formal Shirt',       price: 600, days: 4 },
      { name: 'Trousers',           price: 700, days: 5 },
      { name: 'Suit Stitching',     price: 3500, days: 14 },
    ],
    [
      { name: 'Kurta Pajama',       price: 900, days: 5 },
      { name: 'Sherwani',           price: 5000, days: 15 },
      { name: 'Bandhgala',          price: 4500, days: 12 },
    ],
    [
      { name: 'Casual Shirt',       price: 500, days: 4 },
      { name: 'Chinos',             price: 700, days: 5 },
      { name: 'Blazer',             price: 3800, days: 12 },
    ],
    [
      { name: 'Linen Shirt',        price: 650, days: 4 },
      { name: 'Ethnic Kurta',       price: 1100, days: 6 },
      { name: 'Wedding Sherwani',   price: 6000, days: 15 },
    ],
  ],
  "Kids' Wear": [
    [
      { name: 'Frock Stitching',    price: 350, days: 3 },
      { name: 'School Uniform',     price: 300, days: 3 },
      { name: 'Party Dress',        price: 600, days: 5 },
    ],
    [
      { name: 'Boys Shirt & Pant',  price: 450, days: 4 },
      { name: 'Pavadai Sattai',     price: 500, days: 4 },
      { name: 'Ethnic Set',         price: 700, days: 5 },
    ],
    [
      { name: 'Kurta Set',          price: 550, days: 4 },
      { name: 'Pinafore Dress',     price: 400, days: 3 },
      { name: 'Playsuit',           price: 380, days: 3 },
    ],
    [
      { name: 'Lehenga Choli',      price: 800, days: 6 },
      { name: 'Sherwani for Boys',  price: 900, days: 7 },
      { name: 'Dungarees',          price: 420, days: 3 },
    ],
  ],
  Alterations: [
    [
      { name: 'Trouser Hemming',    price: 100, days: 1 },
      { name: 'Shirt Fitting',      price: 150, days: 1 },
      { name: 'Dress Alteration',   price: 200, days: 2 },
    ],
    [
      { name: 'Saree Fall & Pico',  price: 120, days: 1 },
      { name: 'Blouse Alteration',  price: 180, days: 2 },
      { name: 'Zip Replacement',    price: 80, days:  1 },
    ],
    [
      { name: 'Suit Alteration',    price: 500, days: 3 },
      { name: 'Waist Adjustment',   price: 200, days: 2 },
      { name: 'Sleeve Shortening',  price: 150, days: 1 },
    ],
    [
      { name: 'Jeans Tapering',     price: 180, days: 2 },
      { name: 'Kurta Shortening',   price: 120, days: 1 },
      { name: 'Lining Work',        price: 250, days: 2 },
    ],
  ],
  Embroidery: [
    [
      { name: 'Zari Work',          price: 1200, days: 8 },
      { name: 'Thread Embroidery',  price: 800, days: 6 },
      { name: 'Mirror Work',        price: 950, days: 7 },
    ],
    [
      { name: 'Aari Work',          price: 1000, days: 7 },
      { name: 'Kashmiri Embroidery',price: 1500, days: 10 },
      { name: 'Patch Work',         price: 600, days: 5 },
    ],
    [
      { name: 'Hand Embroidery',    price: 1800, days: 12 },
      { name: 'Cutwork',            price: 700, days: 6 },
      { name: 'Smocking',           price: 900, days: 7 },
    ],
    [
      { name: 'Sequin Work',        price: 1100, days: 8 },
      { name: 'Beadwork',           price: 1300, days: 9 },
      { name: 'Phulkari',           price: 1600, days: 11 },
    ],
  ],
  Other: [
    [
      { name: 'Curtain Stitching',  price: 400, days: 3 },
      { name: 'Cushion Covers',     price: 200, days: 2 },
      { name: 'Table Runner',       price: 250, days: 2 },
    ],
    [
      { name: 'Bag Making',         price: 500, days: 4 },
      { name: 'Apron Stitching',    price: 300, days: 2 },
      { name: 'Mask Stitching',     price: 50,  days: 1 },
    ],
    [
      { name: 'Costume Making',     price: 1500, days: 10 },
      { name: 'Stage Costume',      price: 2000, days: 12 },
      { name: 'Dance Costume',      price: 1800, days: 10 },
    ],
    [
      { name: 'Upholstery Work',    price: 800, days: 5 },
      { name: 'Quilt Making',       price: 700, days: 5 },
      { name: 'Soft Toy Stitching', price: 350, days: 3 },
    ],
  ],
};

const DESCRIPTIONS = {
  "Women's Wear": [
    'With over 15 years of experience in bridal and festive fashion, we bring your dream outfit to life with intricate detailing and a perfect fit every time. From heavily embellished lehengas to elegant saree blouses, every stitch reflects our passion for craftsmanship. Trusted by brides and families across the city for their most special occasions.',
    'We specialise in blending the richness of ethnic tradition with the ease of contemporary silhouettes. Whether it\'s a daily-wear kurti or a grand occasion lehenga, our boutique delivers consistent quality and style. Over 500 satisfied clients trust us with their wardrobe, season after season.',
    'From flowing anarkalis to sharp churidar suits, we bring precision and artistry to every garment we stitch. Our team carefully understands your style preferences and body measurements before cutting a single piece of fabric. Walk in with your cloth and walk out with an outfit that fits like it was made just for you — because it was.',
    'Our boutique is known for merging classic Indian design sensibilities with modern cuts that suit today\'s woman. We work closely with each client to understand the occasion, the fabric, and the desired look before stitching begins. The result is always a garment that feels personal, polished and truly one-of-a-kind.',
    'We believe that quality stitching should never mean long waiting times. Our streamlined process ensures quick turnarounds on blouses, suits and kurtis without ever cutting corners on finish or fit. Perfect for working women who want to look their best without the hassle.',
    'Recipient of two regional tailoring awards, our studio has spent 15 years perfecting women\'s wear in all its forms — from casual office kurtis to grand bridal ensembles. We take pride in meticulous finishing, clean seams and the kind of fit that no off-the-shelf garment can match. Every outfit we stitch is a wearable piece of art.',
    'Bridal lehengas and saree blouses are our forte. We understand how important your wedding day look is, and we give every piece the time, care and attention it deserves. Our team has dressed hundreds of brides, and each one has walked to the mandap feeling confident and beautiful.',
    'Looking great shouldn\'t have to be expensive. We offer stylish, well-fitted stitching for working women, homemakers and college students at prices that won\'t stretch your budget. From western dresses to ethnic suits, we cover the full range with the same commitment to quality.',
    'Bring us your fabric — whether it\'s a treasured silk saree, a gifted georgette piece or something you picked up at the market — and we\'ll transform it into a garment that fits you beautifully. We specialise in creating custom women\'s wear that celebrates your unique taste and personality.',
    'We\'ve been the go-to stitching shop for families in this neighbourhood for over a decade. Our clients return season after season because they know they\'ll get honest advice, careful stitching and a fit that\'s always right. From everyday wear to festive outfits, we handle it all with equal care.',
  ],
  "Men's Wear": [
    'Our master tailor has spent two decades perfecting the art of bespoke men\'s clothing — from sharp formal suits to regal wedding sherwanis. Every garment is cut by hand, fitted with precision, and finished to the highest standard. Whether it\'s your office wardrobe or your wedding day, we make sure you look and feel your absolute best.',
    'We serve working professionals, grooms and style-conscious men who know that a well-fitted outfit makes all the difference. Our range covers formal shirts, linen kurtas, bandhgalas and full wedding packages — all tailored to your exact measurements. Twenty years of experience means we\'ve seen every body type and know how to flatter each one.',
    'From silk kurta pajamas for festive occasions to sharp bandhgalas for formal events, we bring elegance and precision to every stitch. Our workshop is known for the quality of its finishing — no loose threads, no uneven hems, no compromises. Dressed well is our only mode.',
    'Custom shirts and trousers are our bread and butter. We take careful measurements, discuss your preferences for collar style, sleeve length and fit, and deliver garments that feel made for you — because they are. Office wear, casual wear or occasion wear: we do it all with equal attention to detail.',
    'Grooms trust us with their most important outfit of all. Our sherwani and wedding wear collection is stitched with premium materials and finished with the kind of care that only a master craftsman can offer. We\'ve dressed hundreds of grooms who walked to the altar looking like royalty.',
    'For professionals who spend long hours in formal wear, a well-fitted shirt and trouser set is not a luxury — it\'s a necessity. We specialise in corporate wardrobes that combine sharp aesthetics with all-day comfort. Shirts, trousers, blazers and suits: we have your workwear covered.',
    'We bring together the best of ethnic and western tailoring under one roof. Whether you need a kurta for a family function or a three-piece suit for a business meeting, our team handles both with equal expertise. Walk in with your vision and walk out with something better.',
    'Not everyone has time for multiple fittings and long lead times. Our efficient stitching process is designed for men on the go — we take your measurements once, get your preferences right, and deliver on time, every time. Quality and speed, without the compromise.',
    'Men\'s wear is more than just stitching fabric together — it\'s about understanding posture, proportion and personal style. From relaxed casual kurtas to structured formal bandhgalas, we approach every garment with the same design-first mindset. Because how you dress says more than words.',
    'Our shop has built its reputation on one thing: making grooms, professionals and everyday men look exceptional. We listen carefully, stitch meticulously, and deliver garments that turn heads. Sherwanis, suits, kurtas or shirts — whatever the occasion, we\'ve got you covered.',
  ],
  "Kids' Wear": [
    'Children deserve outfits that are as comfortable as they are adorable. We stitch carefully crafted kids\' wear for ages 0 to 16, using soft, skin-friendly fabrics and safe finishes throughout. From tiny frocks to teen party dresses, every outfit is made with love and a keen eye for what little ones actually enjoy wearing.',
    'We understand that kids are hard on their clothes — and we stitch accordingly. Our garments use strong seams, quality threads and durable fabrics that hold up through playtime, school hours and festival celebrations. Soft on skin, tough in wear: that\'s our promise to every parent.',
    'Whether it\'s a school uniform that needs to survive the week or a party dress that needs to dazzle on the weekend, we stitch it all with equal care. Our studio keeps a ready library of children\'s measurements and styles so we can turn around orders quickly — because growing kids can\'t always wait.',
    'Festive season means new outfits, and we make sure your child is the best-dressed at every celebration. From embroidered lehenga cholis for little girls to miniature sherwanis for young boys, our festive range is crafted with the same attention to detail as adult wear.',
    'We know school uniform orders can come with short notice and specific requirements. Our shop is experienced in handling bulk and individual school wear orders quickly and to the school\'s exact specifications. We also stitch casual and sports wear for children of all ages.',
    'Parents keep coming back because their children love what we make. We pay attention to what children find comfortable — no scratchy seams, no stiff collars, no uncomfortable waistbands. Stylish for parents, comfortable for kids: it\'s the balance we always strike.',
    'Active kids need outfits that move with them. We use stretchy, breathable fabrics and reinforced stitching to make sure our kids\' wear can handle everything from playground sprints to dance class performances. Colourful, durable and always fun — just like childhood should be.',
    'Every child\'s special occasion — a birthday party, a family wedding, a school function — deserves an outfit that makes them feel like a star. We do custom stitching for children\'s occasion wear with the same care and craftsmanship we bring to adult clothing. Your child deserves to feel special.',
    'We believe every stitch in a child\'s outfit should reflect the love that went into making it. Our team takes extra time to ensure smooth finishes, gentle fabrics and just the right fit — not too tight, not too loose. Tiny outfits, handled with enormous care.',
    'From newborns to teenagers, we\'ve been dressing children in this neighbourhood for years. Parents trust us because we understand kids\' sizing, know how to factor in growth, and always deliver on time. Reliable, affordable and always well-finished — that\'s our reputation.',
  ],
  Alterations: [
    'Sometimes a great outfit just needs a small adjustment to become perfect. We offer fast, precise alteration services — hemming, taking in, letting out, repairs and more — with a same-day or next-day turnaround for most jobs. Because the right fit can transform how you look and feel in any garment.',
    'We handle alterations for every type of garment, from everyday trousers and shirts to delicate sarees and heavily embroidered bridal wear. Our experienced tailors understand the importance of preserving the original design while making the changes you need. Neat, invisible work is our trademark.',
    'No job is too small and no garment is too precious. Whether it\'s a simple zip replacement or a full resizing of a vintage suit, we treat every alteration with the same level of care and precision. Reliable, affordable and always done right — that\'s what keeps our clients coming back.',
    'With over a decade of experience in garment alterations, we\'ve earned a reputation for clean work, honest timelines and fair pricing. We handle all types of clothing — formal suits, ethnic wear, western garments, and everything in between. Bring it to us and we\'ll make it fit you perfectly.',
    'Working professionals know that a well-fitted garment is worth far more than its price tag. We specialise in fast alterations that fit around busy schedules — drop off before work, pick up in the evening. Quick, professional, and always well-finished.',
    'Bridal alterations require a special kind of attention. A wedding outfit is too important to leave to chance, and we treat every bridal alteration with the patience and precision it deserves. Last-minute adjustments, bustle additions, blouse fitting — we handle it all with calm expertise.',
    'Quality alteration work should be invisible — the garment should simply look like it was always meant to fit you. Our tailors are trained to match stitching patterns, blend seams and preserve the original look of your clothing while making it fit perfectly. Affordable and professional, every time.',
    'From zip replacements to full-garment resizing, we handle the full spectrum of clothing repairs and alterations. Our shop is equipped to work with delicate fabrics like chiffon and silk as well as sturdy materials like denim and canvas. Whatever needs fixing, we\'ll fix it right.',
    'Suits, kurtas, western trousers, saree blouses — we\'ve altered them all. Our team understands the construction of different garment types and knows exactly where adjustments can be made without compromising the structure or look. Expert-level work at neighbourhood prices.',
    'For thousands of satisfied customers, we\'ve been the trusted solution for garments that don\'t quite fit. Our shop is clean, our work is careful, and our prices are fair. Whether it\'s a quick hem or a complex resize, we treat every piece of clothing as if it were our own.',
  ],
  Embroidery: [
    'Our studio brings generations of embroidery tradition into every piece we create. Specialising in zari, aari and kashmiri techniques, we work on sarees, lehengas, blouses and dupattas with painstaking attention to detail. Every design is placed by hand, ensuring a result that no machine can replicate.',
    'We believe that embroidery is where fabric becomes art. Our skilled craftswomen use traditional and contemporary techniques to bring designs to life on any fabric — from delicate georgette to heavy raw silk. We work closely with clients to understand their vision and bring it to life stitch by stitch.',
    'Bridal embroidery is our speciality. We know that a bride\'s lehenga or saree blouse must be absolutely perfect, and we invest the time and craftsmanship to make it so. Our team has completed embroidery work for hundreds of brides, earning a reputation for precision, beauty and reliability.',
    'Every embroidery project we take on is treated as a personal artistic commission. We discuss the design, the thread colours, the density of the work and the deadline before a single needle is threaded. The result is always a piece that exceeds expectations — beautiful, durable and uniquely yours.',
    'Recognised across the city for outstanding embroidery work, our studio has won multiple regional awards for design excellence. We serve individual clients, boutiques and fashion designers who require consistent, high-quality embellishment work. From small accents to full-coverage designs, we do it all.',
    'Mirror work, beadwork and phulkari are more than just embroidery techniques for us — they are art forms we have spent years mastering. We source the finest threads, mirrors and beads to ensure that every piece we create looks brilliant and lasts for years. Festive and bridal embroidery is our greatest passion.',
    'A beautiful garment becomes extraordinary when it carries the right embroidery. We add elegance to your outfits through expert thread work, sequin embellishments and hand-stitched motifs that catch the light in all the right ways. Whether subtle or statement, our work always delivers.',
    'We take on custom embroidery requests for both ethnic and western garments. Whether you want a monogram on a shirt collar or an intricate floral border on a lehenga, we design and execute it with equal enthusiasm. No design is too complex, no fabric too delicate for our team.',
    'Turning a bride\'s embroidery vision into a wearable masterpiece is what drives us every day. We sit with each bride, study reference images, sketch the layout on the fabric, and stitch with care until every element is perfect. Our brides always walk away glowing.',
    'Our embroidery studio has been adding colour and character to clothing for over twelve years. We work with festive fabrics, casual wear and bridal ensembles alike, bringing the same level of detail and artistry to every project. Vibrant, lasting and always beautiful.',
  ],
  Other: [
    'We bring the same craftsmanship that tailors apply to clothing to the world of home furnishings. From precisely measured curtains and custom cushion covers to elegant table runners, we stitch everything to your specifications and deliver on time. Your home deserves the same quality as your wardrobe.',
    'Beyond clothing, our workshop handles a wide range of creative stitching projects — custom bags, travel pouches, accessory holders and more. We work with clients who need something unique and functional, using durable materials and clean finishes throughout. If it can be stitched, we can make it.',
    'Our studio is the go-to costume workshop for theatre groups, dance academies and cultural organisations across the city. We design and stitch stage costumes that are visually striking, comfortable to perform in and durable enough to survive the rigours of repeated performances. Your show will look amazing.',
    'Sometimes you need something stitched that doesn\'t fit into any standard category — and that\'s exactly where we shine. We love taking on unique, creative briefs and turning them into well-crafted finished pieces. Whether it\'s a prop, an accessory or something entirely new, bring us the idea and we\'ll stitch it to life.',
    'Home décor stitching is a craft that requires the same precision as garment making — and we bring every bit of that precision to our upholstery work, quilt making and home linen projects. We measure carefully, select quality fabrics, and stitch clean, durable pieces that add beauty and function to your space.',
    'From school play costumes to elaborate cultural festival outfits, we\'ve dressed performers of every age and type. Our costume design process starts with understanding the character or theme, then sourcing materials and stitching pieces that look great on stage and hold together through repeated use.',
    'Our speciality is stitching that goes beyond everyday garments — bags, curtains, organisers and custom craft pieces. We work with individuals, businesses and event planners to produce functional, well-made items on time and within budget. Practical stitching, done beautifully.',
    'We transform your rooms with custom-stitched home solutions. Our curtains are measured to your window dimensions and finished with professional headings and hems. Our cushion covers are made to fit perfectly and last for years. We bring a tailor\'s eye for detail to every corner of your home.',
    'From soft toys for gifting to elaborate festival costumes, our creative stitching studio handles projects that other shops turn away. We love a challenge, and we bring genuine skill and enthusiasm to every unconventional stitching brief. Tell us what you need — we\'ll figure out how to make it.',
    'We are the answer to the question: "Can someone stitch this?" — whatever "this" might be. Our experienced team has handled everything from custom pet accessories to theatre backdrops, always delivering clean, durable, well-finished work. No garment, no problem. No project is too unusual for us.',
  ],
};

const SHOP_SUFFIX = [
  'Creations', 'Stitching Works', 'Boutique', 'Tailor', 'Fashion Studio',
  'Couture', 'Thread & Needle', 'Tailors', 'Designs', 'Sewing Centre',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr, i) { return arr[i % arr.length]; }

function randomRating() {
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
}

function randomReviews() {
  return Math.floor(20 + Math.random() * 400);
}

function randomExperience() {
  return Math.floor(2 + Math.random() * 22);
}

// ── Build tailor list ─────────────────────────────────────────────────────────

const CATEGORIES = Object.keys(CATEGORY_SERVICES);
const tailors = [];
let nameIndex = 0;

for (const loc of CITIES) {
  for (const category of CATEGORIES) {
    for (let i = 0; i < 10; i++) {
      const isFemale = (category === "Women's Wear" || category === "Kids' Wear" || category === 'Embroidery')
        ? Math.random() > 0.3
        : Math.random() > 0.6;
      const firstName = isFemale
        ? FEMALE_NAMES[nameIndex % FEMALE_NAMES.length]
        : MALE_NAMES[nameIndex % MALE_NAMES.length];
      const surname = SURNAMES[(nameIndex + 7) % SURNAMES.length];
      nameIndex++;

      const shopName = `${surname} ${pick(SHOP_SUFFIX, nameIndex)}`;
      const email = `${firstName.toLowerCase()}.${surname.toLowerCase()}${nameIndex}@stiched.io`;
      const serviceSet = CATEGORY_SERVICES[category][i % 4];

      tailors.push({
        name: `${firstName} ${surname}`,
        email,
        shopName,
        description: pick(DESCRIPTIONS[category], i),
        experience: randomExperience(),
        city: loc.city,
        state: loc.state,
        pincode: `${loc.pinBase}${String(i + 1).padStart(3, '0')}`,
        rating: randomRating(),
        totalReviews: randomReviews(),
        primaryCategory: category,
        services: serviceSet.map(s => ({ ...s, category })),
      });
    }
  }
}

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB — seeding ${tailors.length} tailors…\n`);

  const hashedPassword = await bcrypt.hash('Stiched@123', 12);
  let created = 0, skipped = 0;

  for (const t of tailors) {
    const existing = await User.findOne({ email: t.email });
    if (existing) { skipped++; continue; }

    const user = await User.create({
      name: t.name,
      email: t.email,
      password: hashedPassword,
      role: 'tailor',
      isVerified: true,
    });

    const coverPool = SHOP_PHOTOS[t.primaryCategory] ?? [];
    const shopPhotos = coverPool.length
      ? [{ image: coverPool[created % coverPool.length], caption: t.shopName }]
      : [];

    const samplePool = WORK_SAMPLES[t.primaryCategory] ?? [];
    const workSamples = samplePool.length
      ? Array.from({ length: 4 }, (_, i) => ({
          image: samplePool[(created * 4 + i) % samplePool.length],
          caption: '',
        }))
      : [];

    await Tailor.create({
      user: user._id,
      shopName: t.shopName,
      description: t.description,
      experience: t.experience,
      services: t.services.map((service, index) => ({
        ...service,
        priceMayVary: index === 0 ? false : service.price >= 800,
      })),
      location: { city: t.city, state: t.state, pincode: t.pincode },
      socialLinks: dummySocialLinks(t.shopName),
      rating: t.rating,
      totalReviews: t.totalReviews,
      isAvailable: true,
      shopPhotos,
      workSamples,
    });

    created++;
    if (created % 50 === 0) process.stdout.write(`  ${created} created…\n`);
  }

  console.log(`\nDone. ${created} tailors created, ${skipped} skipped (already exist).`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });

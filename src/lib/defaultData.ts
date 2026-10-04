export interface BaseItem {
  id: number | string;
  name?: string;
  title?: string;
  description?: string;
  price?: string | number;
  category?: string;
  image?: string;
  primaryImage?: string;
  location?: string;
  beds?: number;
  baths?: number;
  area?: string;
  type?: string;
  icon?: string;
  sizes?: string[];
  originalPrice?: string | number;
  sizeStocks?: Record<string, number>;
  colors?: string[];
  colorStocks?: Record<string, number>;
  colorImages?: Record<string, string>;
  images?: string[];
  skinType?: string;
  ingredients?: string[];
  specs?: Record<string, string>;
  [key: string]: any;
}

export const TEMPLATE_DEFAULTS: Record<number, BaseItem[]> = {
  1: [ // LuxuryRestaurant
    { id: 101, name: 'ستيك واغيو A5', description: 'لحم بقري ياباني فاخر مع صلصة الكمأة السوداء', price: '٣٥٠ ريال', category: 'الأطباق الرئيسية', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800' },
    { id: 102, name: 'كافيار بيلوغا', description: 'كافيار فاخر يقدم مع بليني تقليدي وكريمة حامضة', price: '٥٠٠ ريال', category: 'المقبلات', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800' },
    { id: 103, name: 'سالمون مشوي', description: 'سالمون نرويجي طازج مع هليون وصلصة الزبدة والليمون', price: '١٨٠ ريال', category: 'الأطباق الرئيسية', image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=800' },
    { id: 104, name: 'سوفليه الشوكولاتة', description: 'شوكولاتة فالرونا الداكنة مع آيس كريم الفانيليا', price: '٨٥ ريال', category: 'الحلويات', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800' }
  ],
  2: [ // ModernGrill
    { id: 201, name: 'أضلاع مدخنة', description: 'أضلاع بقري مدخنة لمدة ١٢ ساعة مع صلصة الباربيكيو', price: '١٢٠ ريال', category: 'اللحوم المدخنة', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800' },
    { id: 202, name: 'بريسكت ساندوتش', description: 'خبز بريوش، لحم بريسكت، كولسلو، مخلل', price: '٦٥ ريال', category: 'ساندوتشات', image: 'https://images.unsplash.com/photo-1627308595229-7830b5c91f15?q=80&w=800' },
    { id: 203, name: 'ستيك ريب آي', description: '٣٠٠ جرام ستيك مشوي على اللهب، بطاطس مهروسة', price: '١٨٠ ريال', category: 'ستيك', image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=800' },
    { id: 204, name: 'أجنحة دجاج بافلو', description: 'أجنحة مقرمشة بصلصة البافلو الحارة مع صوص الرانش', price: '٤٥ ريال', category: 'مقبلات', image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?q=80&w=800' }
  ],
  3: [ // FastFoodDelivery
    { id: 301, name: 'دبل تشيز برجر', description: 'شريحتين لحم أنجوس، جبنة شيدر مضاعفة، صوص سري', price: '٣٥ ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' },
    { id: 302, name: 'كريسبي تشيكن', description: 'دجاج مقرمش حار، خس، مايونيز، مخلل', price: '٢٨ ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=800' },
    { id: 303, name: 'بطاطس بالجبنة', description: 'بطاطس مقلية مغطاة بصوص الجبن الساخن والهلابينو', price: '١٥ ريال', category: 'أطباق جانبية', image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=800' },
    { id: 304, name: 'بيتزا بيبروني', description: 'عجينة رقيقة، صلصة طماطم، جبن موزاريلا، بيبروني', price: '٤٥ ريال', category: 'بيتزا', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800' },
    { id: 305, name: 'موهيتو فراولة', description: 'مشروب منعش بالفراولة الطازجة والنعناع', price: '١٢ ريال', category: 'مشروبات', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800' }
  ],
  4: [ // CozyCafe
    { id: 401, name: 'اسبريسو متميز', description: 'جرعة مركزة من القهوة الغنية بمذاقها الكلاسيكي القوي', price: '١٢ ريال', category: 'القهوة الساخنة', image: 'https://images.unsplash.com/photo-1510707577719-ee7c182ac495?q=80&w=800' },
    { id: 402, name: 'كابتشينو كلاسيك', description: 'توازن مثالي بين الاسبريسو، الحليب المبخر، والرغوة الغنية', price: '١٦ ريال', category: 'القهوة الساخنة', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800' },
    { id: 403, name: 'سبانيش لاتيه بارد', description: 'قهوة اسبريسو مع الحليب المكثف المحلى ومكعبات الثلج', price: '٢٠ ريال', category: 'القهوة الباردة', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800' },
    { id: 404, name: 'آيس لاتيه', description: 'لاتيه بارد ومنعش لأيام الصيف', price: '١٨ ريال', category: 'القهوة الباردة', image: 'https://images.unsplash.com/photo-1461023058943-0708e5223eeb?q=80&w=800' },
    { id: 405, name: 'كيكة العسل', description: 'طبقات من الكيك الهش بعسل النحل الطبيعي', price: '٢٢ ريال', category: 'الحلويات', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800' },
    { id: 406, name: 'كرواسون زبدة', description: 'مخبوز طازجاً كل صباح', price: '١٠ ريال', category: 'مخبوزات', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800' }
  ],
  5: [ // SpecialtyCoffee
    { id: 501, name: 'إثيوبيا يرقاتشيف (V60)', description: 'حبوب معالجة مجففة ذات إيحاءات زهرية فاخرة بنوتات الياسمين والبرتقال والحلاوة العسلية', price: '26 ريال', category: 'قهوة مقطرة V60', image: 'https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800' },
    { id: 502, name: 'كولومبيا وسيلة - خمرية آنايروبيك', description: 'تخمير لا هوائي لمدة 72 ساعة، نكهة معقدة فاخرة بنوتات الكرز الأسود والشوكولاتة', price: '29 ريال', category: 'قهوة مقطرة V60', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800' },
    { id: 503, name: 'فلات وايت اسبريسو مزدوج', description: 'جرعتين اسبريسو مع حليب مبخر بقوام ميكروفوم مخملي كريمي', price: '20 ريال', category: 'بار الاسبريسو', image: 'https://images.unsplash.com/photo-1577968897966-3d4133400030?q=80&w=800' },
    { id: 504, name: 'كولد برو منقوع 24 ساعة', description: 'قهوة مستخلصة بالماء البارد، حموضة منخفضة جداً مع قوام غني ونكهات شوكولاتة ناعمة', price: '24 ريال', category: 'القهوة الباردة', image: 'https://images.unsplash.com/photo-1461023058943-0708e5223eeb?q=80&w=800' },
    { id: 505, name: 'ظرف محاصيل كوستاريكا تارازو (250g)', description: 'كيس بن طازج من أفضل مزارع كوستاريكا. حمصة حديثة ومناسبة جداً لمشروبات الفلتر والاسبريسو', price: '65 ريال', category: 'مبيعات حزم البن', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800' }
  ],
  6: [ // BakeryCafe
    { id: 601, name: 'كرواسون لوز', description: 'كرواسون زبدة فرنسي محشو بكريمة اللوز ومغطى باللوز المحمص', price: '١٨ ريال', category: 'المخبوزات', image: 'https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?q=80&w=800' },
    { id: 602, name: 'بان أو شوكولا', description: 'عجينة مورقة محشوة بشوكولاتة بلجيكية داكنة', price: '١٥ ريال', category: 'المخبوزات', image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=800' },
    { id: 603, name: 'توست الأفوكادو', description: 'خبز الساور دو الطازج مع الأفوكادو المهروس والبيض المسلوق', price: '٣٥ ريال', category: 'فطور الصباح', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=800' },
    { id: 604, name: 'فرنش توست بالبريوش', description: 'يقدم مع الفواكه الطازجة وشراب القيقب الطبيعي', price: '٤٢ ريال', category: 'فطور الصباح', image: 'https://images.unsplash.com/photo-1484723091791-009f52f451f2?q=80&w=800' },
    { id: 605, name: 'قهوة اليوم', description: 'قهوة مقطرة طازجة من محاصيل مختارة بعناية', price: '١٢ ريال', category: 'القهوة', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800' }
  ],
  7: [ // LuxuryVillas
    { id: 701, title: 'فيلا ملكية بتصميم كلاسيكي', location: 'حي الملقا، الرياض', price: '١٥,٠٠٠,٠٠٠ ريال', type: 'للبيع', beds: 6, baths: 8, area: '1200', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000' },
    { id: 702, title: 'قصر بانورامي مع مسبح خاص', location: 'حي حطين، الرياض', price: '٢٥,٥٠٠,٠٠٠ ريال', type: 'للبيع', beds: 8, baths: 10, area: '2500', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000' },
    { id: 703, title: 'فيلا مودرن ذكية', location: 'الياسمين، الرياض', price: '٣٥٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', beds: 5, baths: 6, area: '800', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000' },
    { id: 704, title: 'قصر عصري بإطلالة', location: 'الدرعية، الرياض', price: '٤٥,٠٠٠,٠٠٠ ريال', type: 'للبيع', beds: 10, baths: 12, area: '3500', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000' }
  ],
  8: [ // ModernApartments
    { id: 801, title: 'شقة فاخرة بإطلالة بانورامية', location: 'المركز المالي، الرياض', price: '٢,٥٠٠,٠٠٠ ريال', type: 'للبيع', beds: 3, baths: 3, area: '210', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000' },
    { id: 802, title: 'شقة مودرن بتصميم ذكي', location: 'المعذر، الرياض', price: '١٢٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', beds: 2, baths: 2, area: '140', image: 'https://images.unsplash.com/photo-1502672260266-1c1e52504427?q=80&w=1000' },
    { id: 803, title: 'بنتهاوس مع تراس واسع', location: 'حي العليا، الرياض', price: '٤,٢٠٠,٠٠٠ ريال', type: 'للبيع', beds: 4, baths: 5, area: '350', image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1000' },
    { id: 804, title: 'ستوديو أنيق مؤثث بالكامل', location: 'حي النرجس، الرياض', price: '٥٥,٠٠٠ ريال / سنوياً', type: 'للإيجار', beds: 1, baths: 1, area: '70', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000' }
  ],
  9: [ // CommercialAgency
    { id: 901, title: 'مبنى تجاري كامل', location: 'طريق الملك فهد، الرياض', price: '٤٥,٠٠٠,٠٠0 ريال', type: 'للبيع', category: 'تجاري', area: '4500', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800' },
    { id: 902, title: 'مكتب مساحة مفتوحة', location: 'العليا، الرياض', price: '٢٥٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', category: 'مكاتب', area: '300', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800' },
    { id: 903, title: 'معرض تجاري واجهة شارعين', location: 'طريق التخصصي، الرياض', price: '٣,٢٠٠,٠٠٠ ريال', type: 'للبيع', category: 'معارض', area: '550', image: 'https://images.unsplash.com/photo-1582657233895-0f37a3f150c0?q=80&w=800' },
    { id: 904, title: 'مساحة عمل مشتركة مجهزة', location: 'المركز المالي، الرياض', price: '٤٠٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', category: 'مكاتب', area: '600', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=800' },
    { id: 905, title: 'أرض تجارية خام', location: 'شمال الرياض', price: '١٢,٠٠٠,٠٠٠ ريال', type: 'للبيع', category: 'أراضي', area: '10000', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800' }
  ],
  10: [ // HeavyConstruction
    { id: 1001, title: 'برج الأفق', category: 'مشاريع تجارية', description: 'تشييد ناطحة سحاب حديثة بالكامل', image: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800' },
    { id: 1002, title: 'مجمع السكني', category: 'مشاريع سكنية', description: 'بناء وتجهيز مجمع سكني متكامل', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800' },
    { id: 1003, title: 'جسر الوادي', category: 'بنية تحتية', description: 'جسر بنية تحتية مقاوم للعوامل الزمنية', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800' },
    { id: 1004, title: 'مصنع الحديد', category: 'مشاريع صناعية', description: 'تنفيذ وتشييد مصانع ضخمة وهياكل معدنية', image: 'https://images.unsplash.com/photo-1533280181515-38b81309f485?q=80&w=800' }
  ],
  11: [ // ModernArchitecture
    { id: 1101, title: 'فيلا أمالا', category: 'سكني', description: 'تصميم فيلا سكنية تجمع البساطة بالجمال المستدام', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000' },
    { id: 1102, title: 'مقر شركة آفاق', category: 'تجاري', description: 'مبنى إداري بتصميم ذكي ومساحات مفتوحة', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000' },
    { id: 1103, title: 'متحف الضوء', category: 'ثقافي', description: 'صرح ثقافي يستغل الإضاءة الطبيعية للتأثير البصري', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000' },
    { id: 1104, title: 'شاليه الرمال', category: 'ضيافة', description: 'منتجع صحراوي فاخر مدمج مع الطبيعة المحيطة', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000' }
  ],
  12: [ // HomeRenovation
    { id: 1201, title: 'تجديد صالة معيشة', description: 'تحويل صالة كلاسيكية إلى مساحة مودرن مفتوحة', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' },
    { id: 1202, title: 'توسعة مطبخ', description: 'إضافة جزيرة مركزية وتحديث الخزائن والأجهزة', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800' },
    { id: 1203, title: 'ترميم واجهة', description: 'تحديث الواجهة الخارجية بإضاءة مخفية وحجر طبيعي', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800' }
  ],
  13: [ // FashionTemplate
    { id: 1301, title: 'معطف صيفي حريري فاخر', description: 'مصنوع من أجود خامات الحرير الطبيعي', price: '145.00', originalPrice: '200.00', category: 'أزياء راقية', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000', sizes: ['S', 'M', 'L'], sizeStocks: { 'S': 2, 'M': 0, 'L': 5 }, colors: ['أسود', 'أبيض'], colorImages: { 'أسود': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000' } },
    { id: 1302, title: 'فستان سهرة كلاسيكي طويل', description: 'قصة انسيابية ساحرة تبرز جمال التفاصيل', price: '210.00', originalPrice: '350.00', category: 'فساتين', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000', sizes: ['XS', 'S', 'M', 'L'], sizeStocks: { 'XS': 0, 'S': 1, 'M': 5, 'L': 10 }, colors: ['أحمر داكن', 'أسود'], colorImages: { 'أحمر داكن': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000' } },
    { id: 1303, title: 'بدلة رسمية عصرية نسائية', description: 'تصميم احترافي راقٍ يعكس القوة والثقة', price: '180.00', category: 'بدلات', image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1000' },
    { id: 1304, title: 'حقيبة جلدية فاخرة', description: 'جلد طبيعي فاخر مع إكسسوارات مطلية بالذهب', price: '95.00', originalPrice: '150.00', category: 'إكسسوارات', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000' },
    { id: 1305, title: 'حقيبة كلاسيكية راقية', description: 'حقيبة رائعة لمختلف المناسبات والأوقات', price: '120.00', originalPrice: '250.00', category: 'إكسسوارات', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000', sizes: ['S', 'M', 'L'], sizeStocks: { 'S': 3, 'M': 0, 'L': 5 }, colors: ['أحمر', 'أسود'], colorStocks: { 'أحمر': 0, 'أسود': 3 }, colorImages: { 'أحمر': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000', 'أسود': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000' } }
  ],
  14: [ // ElectronicStore
    { id: 1401, title: 'آيفون 16 برو ماكس', description: 'أحدث إصدار بتصميم من التيتانيوم وكاميرا 48MP', price: '4500.00', originalPrice: '4800.00', category: 'الهواتف الذكية', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000', sizes: ['256GB', '512GB', '1TB'], sizeStocks: { '256GB': 10, '512GB': 5, '1TB': 2 }, colors: ['تيتانيوم طبيعي', 'أسود'], colorImages: { 'تيتانيوم طبيعي': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000' } },
    { id: 1402, title: 'ماك بوك اير M3', description: 'نحافة فائقة وأداء استثنائي مع شريحة M3', price: '4200.00', category: 'الحواسيب', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000', sizes: ['256GB', '512GB'], sizeStocks: { '256GB': 4, '512GB': 3 }, colors: ['فضي', 'رمادي فلكي'], colorImages: { 'فضي': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000' } },
    { id: 1403, title: 'سماعات إيربودز برو 2', description: 'إلغاء ضجيج نشط وتجربة صوت محيطي', price: '850.00', originalPrice: '999.00', category: 'الصوتيات', image: 'https://images.unsplash.com/photo-1606220588913-b3aecb490f23?q=80&w=1000', sizes: ['قياسي'], sizeStocks: { 'قياسي': 20 }, colors: ['أبيض'] },
    { id: 1404, title: 'آيباد برو 11 إنش', description: 'شاشة ريتينا ليكويد وشريحة M4 الجبارة', price: '3200.00', category: 'الأجهزة اللوحية', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=1000', sizes: ['128GB', '256GB'], sizeStocks: { '128GB': 8, '256GB': 5 }, colors: ['رمادي فلكي', 'فضي'] },
    { id: 1405, title: 'ساعة آبل الترا 2', description: 'للرياضيين وعشاق المغامرات', price: '2900.00', category: 'الساعات الذكية', image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1000', sizes: ['49mm'], sizeStocks: { '49mm': 12 }, colors: ['برتقالي', 'أسود'] }
  ]
,
  15: [ // Skincare Store
    { id: 1501, title: 'سيروم حمض الهيالورونيك النقي', price: '140.00', originalPrice: '180.00', category: 'العناية بالبشرة', skinType: 'جميع أنواع البشرة', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800', description: 'سيروم مكثف لترطيب عميق واستعادة نضارة البشرة وتقليل مظهر الخطوط الدقيقة.', ingredients: ['حمض الهيالورونيك', 'فيتامين ب5'], specs: { 'الحجم': '30 مل', 'الاستخدام': 'صباحاً ومساءً' } },
    { id: 1502, title: 'لوشن ترطيب الجسم بزبدة الشيا', price: '95.00', originalPrice: '120.00', category: 'العناية بالجسم', skinType: 'البشرة الجافة', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800', description: 'لوشن حريري مغذٍ يمنح جسمك ترطيباً يدوم حتى 48 ساعة.', ingredients: ['زبدة الشيا العضوية', 'زيت اللوز الحلو'], specs: { 'الحجم': '250 مل', 'الملمس': 'كريمي خفيف' } },
    { id: 1503, title: 'غسول رغوي لطيف للبشرة الحساسة', price: '110.00', category: 'العناية بالبشرة', skinType: 'البشرة الحساسة', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800', description: 'ينظف الشوائب والزيوت الزائدة بعمق دون التسبب في جفاف الجلد.', ingredients: ['مستخلص البابونج', 'الجلسرين النباتي'], specs: { 'الحجم': '150 مل', 'الرغوة': 'ناعمة' } },
    { id: 1504, title: 'مقشر الجسم بالسكر والقهوة العضوية', price: '130.00', originalPrice: '160.00', category: 'العناية بالجسم', skinType: 'جميع أنواع البشرة', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800', description: 'مقشر طبيعي ينشط الدورة الدموية ويزيل الخلايا الميتة.', ingredients: ['حبوب القهوة', 'سكر القصب'], specs: { 'الوزن': '250 جم' } }
  ],
  16: [ // Dental Clinic
    { id: 1601, title: 'زراعة الأسنان', description: 'تقنية ألمانية مضمونة مدى الحياة لاستعادة ابتسامتك.', price: '٥٠٠ ريال', category: 'الخدمات الطبية', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800' },
    { id: 1602, title: 'ابتسامة هوليود', description: 'تصميم ابتسامة رقمية باستخدام قشور الفينير فائقة الرقة.', price: '٣٥٠ ريال', category: 'الخدمات التجميلية', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800' },
    { id: 1603, title: 'تقويم الأسنان', description: 'تقويم شفاف ومعدني لأسنان مستقيمة وإطباق سليم.', price: '٢٥٠ ريال', category: 'الخدمات التقويمية', image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=800' }
  ]

};

export function getDefaultItemsForTemplate(templateId: number): BaseItem[] {
  return TEMPLATE_DEFAULTS[templateId] || TEMPLATE_DEFAULTS[1];
}

export const TEMPLATE_DEFAULT_HEROES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600',
  2: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600',
  3: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=1600',
  4: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600',
  5: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600',
  6: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1600',
  7: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600',
  8: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600',
  9: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600',
  10: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=1600',
  11: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600',
  12: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?q=80&w=1600',
  13: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600',
  14: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1600'
};

export const TEMPLATE_DEFAULT_TEXTS: Record<number, { businessName: string; heroTitle: string; heroSubtitle: string }> = {
  1: { businessName: 'المطعم الإيطالي الفاخر', heroTitle: 'تذوق أشهى الأطباق الإيطالية والفاخرة', heroSubtitle: 'تجربة طعام لا تُنسى بأيدي أشهر الطهاة' },
  2: { businessName: 'مطعم الشواء العصري', heroTitle: 'أشهى المأكولات والمشاوي الطازجة', heroSubtitle: 'طعم أصيل وجودة عالية يومياً' },
  3: { businessName: 'مطعم الوجبات السريعة', heroTitle: 'وجبات سريعة ولذيذة في أي وقت', heroSubtitle: 'اطلب الآن ليصلك أسرع دليفري' },
  4: { businessName: 'كافيه أرومار الكلاسيكي', heroTitle: 'لحظات هادئة مع أطيب فنجان قهوة', heroSubtitle: 'ننتظرك يومياً لنقدم لك أجود حبوب القهوة' },
  5: { businessName: 'مقهى القهوة المختصة', heroTitle: 'عالم القهوة المختصة المميزة', heroSubtitle: 'مذاق فريد ومحامص عالمية مختارة' },
  6: { businessName: 'مخبز ومقهى المخبوزات', heroTitle: 'مخبوزات طازجة وحلويات شهية', heroSubtitle: 'طازجة يومياً بأجود المكونات الطبيعية' },
  7: { businessName: 'منتجع الفلل الفاخرة', heroTitle: 'اقامة فاخرة وفيلا أحلامك', heroSubtitle: 'احجز أفضل الفلل والمنتجعات الاستثنائية' },
  8: { businessName: 'مجمع الشقق العصرية', heroTitle: 'شقق سكنية حديثة ومجهزة بالكامل', heroSubtitle: 'راحة وأمان في أرقى أحياء المدينة' },
  9: { businessName: 'المكتب العقاري الرسمي', heroTitle: 'شريكك الموثوق في الاستثمار العقاري', heroSubtitle: 'إدارة أملاك، تثمين، وبيع وشراء بأعلى عائد' },
  10: { businessName: 'شركة الإنشاءات والمقاولات', heroTitle: 'نبني مستقبل مشاريعكم بكفاءة', heroSubtitle: 'خبرة طويلة في البناء والمقاولات العامة' },
  11: { businessName: 'مكتب التصميم المعماري', heroTitle: 'تصاميم معمارية مبتكرة وحلول هندسية', heroSubtitle: 'نحول أفكارك إلى واقع معماري ساحر' },
  12: { businessName: 'شركة الديكور والتشطيبات', heroTitle: 'لمسات فنية وتصميم داخلي راقٍ', heroSubtitle: 'تشطيبات وديكورات تضفي الجمال على مساحتك' },
  13: { businessName: 'بوتيك الأزياء الراقية', heroTitle: 'تصاميم تعكس ذوقك الرفيع', heroSubtitle: 'استكشف أحدث تشكيلات الموضة الفاخرة مع تجربة تسوق استثنائية' },
  14: { businessName: 'متجر الأجهزة الإلكترونية', heroTitle: 'أحدث الأجهزة الذكية والتقنيات العصرية', heroSubtitle: 'عالمك الذكي للتقنية الحديثة بضمان معتمد' },
  15: { businessName: 'متجر العناية بالبشرة والجسم', heroTitle: 'اكتشفي جمالك ونضارتك الطبيعية', heroSubtitle: 'أفضل منتجات العناية بالبشرة بمكونات طبيعية 100%' },
};

export function getDefaultHeroForTemplate(templateId: number): string {
  return TEMPLATE_DEFAULT_HEROES[templateId] || TEMPLATE_DEFAULT_HEROES[1];
}

/**
 * Utility to map existing merchant global JSON content when switching templates,
 * ensuring core business data (Business Name, Logo, Contact info, Items) is preserved.
 */
export function migrateContentOnTemplateSwitch(existingContent: any, newTemplateId: number): any {
  const newDefaults = TEMPLATE_DEFAULT_TEXTS[newTemplateId] || TEMPLATE_DEFAULT_TEXTS[1];

  if (!existingContent) {
    return {
      templateId: newTemplateId,
      businessName: newDefaults.businessName,
      heroTitle: newDefaults.heroTitle,
      heroSubtitle: newDefaults.heroSubtitle,
      items: getDefaultItemsForTemplate(newTemplateId),
      heroBgUrl: getDefaultHeroForTemplate(newTemplateId),
    };
  }

  const defaultNewItems = getDefaultItemsForTemplate(newTemplateId);
  const isDifferentTemplate = existingContent.templateId && Number(existingContent.templateId) !== Number(newTemplateId);
  
  // Check if existing content holds default texts from any previous template
  const isOldDefaultBusinessName = Object.values(TEMPLATE_DEFAULT_TEXTS).some(t => t.businessName === existingContent.businessName);
  const isOldDefaultHeroTitle = Object.values(TEMPLATE_DEFAULT_TEXTS).some(t => t.heroTitle === existingContent.heroTitle);
  const isOldDefaultHeroSubtitle = Object.values(TEMPLATE_DEFAULT_TEXTS).some(t => t.heroSubtitle === existingContent.heroSubtitle);

  // If template changed, reset items to the new template's default items
  const items = (!isDifferentTemplate && Array.isArray(existingContent.items) && existingContent.items.length > 0)
    ? existingContent.items
    : defaultNewItems;

  const finalBusinessName = (isDifferentTemplate && isOldDefaultBusinessName)
    ? newDefaults.businessName
    : (existingContent.businessName || newDefaults.businessName);

  const finalHeroTitle = (isDifferentTemplate && isOldDefaultHeroTitle)
    ? newDefaults.heroTitle
    : (existingContent.heroTitle || newDefaults.heroTitle);

  const finalHeroSubtitle = (isDifferentTemplate && isOldDefaultHeroSubtitle)
    ? newDefaults.heroSubtitle
    : (existingContent.heroSubtitle || newDefaults.heroSubtitle);

  return {
    ...existingContent,
    templateId: newTemplateId,
    // Core business information
    businessName: finalBusinessName,
    heroTitle: finalHeroTitle,
    heroSubtitle: finalHeroSubtitle,
    phone: existingContent.phone || '',
    whatsapp: existingContent.whatsapp || '',
    address: existingContent.address || '',
    workingHours: existingContent.workingHours || '',
    instagram: existingContent.instagram || '',
    tiktok: existingContent.tiktok || '',
    
    // Global styling defaults (preserve if present)
    primaryColor: existingContent.primaryColor || '#008060',
    secondaryColor: existingContent.secondaryColor || '#111827',
    bgColor: existingContent.bgColor || '#ffffff',
    textColor: existingContent.textColor || '#1f2937',
    fontFamily: existingContent.fontFamily || 'Alexandria',
    baseFontSize: existingContent.baseFontSize || 16,
    buttonRadius: existingContent.buttonRadius || 'rounded-xl',

    // Hero background preservation or default update
    heroBgUrl: (isDifferentTemplate && Object.values(TEMPLATE_DEFAULT_HEROES).includes(existingContent.heroBgUrl))
      ? getDefaultHeroForTemplate(newTemplateId)
      : (existingContent.heroBgUrl || getDefaultHeroForTemplate(newTemplateId)),

    // Items array preserved or updated
    items: items,
  };
}

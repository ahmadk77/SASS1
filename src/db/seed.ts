import { db } from './index.ts';
import { templates } from './schema.ts';
import { count, sql } from 'drizzle-orm';
import { logger } from '../lib/logger.ts';

export async function seedDatabase() {
  try {
    logger.info('Starting database auto-schema verification & migration...');

    // 1. Core Tables: tenants & users
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL DEFAULT 'المتجر الافتراضي',
        "subdomain" TEXT UNIQUE NOT NULL,
        "custom_domain" TEXT UNIQUE,
        "template_category" TEXT NOT NULL DEFAULT 'general',
        "supported_languages" TEXT[],
        "default_language" TEXT DEFAULT 'ar',
        "supported_currencies" TEXT[],
        "default_currency" TEXT DEFAULT 'SAR',
        "created_at" TIMESTAMP DEFAULT NOW(),
        "assigned_user_email" TEXT,
        "deleted_at" TIMESTAMP,
        "user_id" INTEGER
      );
    `).catch(e => console.warn('tenants table create notice:', e?.message));

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "uid" TEXT NOT NULL UNIQUE,
        "email" TEXT NOT NULL UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'active',
        "role" TEXT NOT NULL DEFAULT 'user',
        "name" TEXT,
        "permissions" TEXT DEFAULT 'all',
        "last_active_at" TIMESTAMP DEFAULT NOW(),
        "is_online" INTEGER DEFAULT 1,
        "tenant_id" INTEGER,
        "avatar_url" TEXT,
        "password" TEXT,
        "location" TEXT,
        "ip_address" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "deleted_at" TIMESTAMP,
        "assigned_user_email" TEXT,
        "subscription_type" TEXT,
        "subscription_price" INTEGER,
        "subscription_start_date" TIMESTAMP,
        "subscription_end_date" TIMESTAMP,
        "quiz_answers" JSONB
      );
    `).catch(e => console.warn('users table create notice:', e?.message));

    // Ensure all columns exist on users
    const userColumns = [
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user'`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" TEXT DEFAULT 'all'`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_online" INTEGER DEFAULT 1`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ip_address" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_type" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_price" INTEGER`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_start_date" TIMESTAMP`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_end_date" TIMESTAMP`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "quiz_answers" JSONB`
    ];
    for (const q of userColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    // Ensure all columns exist on tenants
    const tenantColumns = [
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "custom_domain" TEXT`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "template_category" TEXT NOT NULL DEFAULT 'general'`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "supported_languages" TEXT[]`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "default_language" TEXT DEFAULT 'ar'`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "supported_currencies" TEXT[]`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "default_currency" TEXT DEFAULT 'SAR'`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "user_id" INTEGER`
    ];
    for (const q of tenantColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    // 2. Templates, Subscriptions, Websites, Website Content
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "templates" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'native',
        "external_url" TEXT,
        "category" TEXT NOT NULL DEFAULT 'general',
        "image" TEXT,
        "default_content" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW(),
        "assigned_user_email" TEXT,
        "deleted_at" TIMESTAMP
      );
    `).catch(() => {});

    const templateColumns = [
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "description" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'native'`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "external_url" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'general'`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "image" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "default_content" JSONB NOT NULL DEFAULT '{}'`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`
    ];
    for (const q of templateColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'monthly',
        "status" TEXT NOT NULL DEFAULT 'active',
        "billing_cycle" TEXT,
        "trial_end" TIMESTAMP,
        "renewal_date" TIMESTAMP,
        "payment_provider" TEXT,
        "has_custom_domain" BOOLEAN NOT NULL DEFAULT false,
        "requested_domain_name" TEXT,
        "total_price" INTEGER,
        "invoice_id" TEXT,
        "cancelled_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "assigned_user_email" TEXT
      );
    `).catch(() => {});

    const subColumns = [
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'monthly'`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_cycle" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_end" TIMESTAMP`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "renewal_date" TIMESTAMP`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "payment_provider" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "has_custom_domain" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "requested_domain_name" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "total_price" INTEGER`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "invoice_id" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`
    ];
    for (const q of subColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "websites" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "template_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "assigned_user_email" TEXT,
        "deleted_at" TIMESTAMP
      );
    `).catch(() => {});

    const websiteColumns = [
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "template_id" INTEGER`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`
    ];
    for (const q of websiteColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "website_content" (
        "id" SERIAL PRIMARY KEY,
        "website_id" INTEGER NOT NULL,
        "content" JSONB NOT NULL DEFAULT '{}',
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "deleted_at" TIMESTAMP
      );
    `).catch(() => {});

    const websiteContentColumns = [
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "website_id" INTEGER`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "content" JSONB NOT NULL DEFAULT '{}'`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`
    ];
    for (const q of websiteContentColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    // 3. Notifications, Staff Logs, Workspaces, Saved Templates
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER,
        "target_email" TEXT,
        "title" TEXT NOT NULL DEFAULT '',
        "message" TEXT NOT NULL DEFAULT '',
        "is_required" INTEGER DEFAULT 0,
        "is_read" INTEGER DEFAULT 0,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `).catch(() => {});

    const notifColumns = [
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "target_email" TEXT`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_required" INTEGER DEFAULT 0`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_read" INTEGER DEFAULT 0`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP`,
      `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`
    ];
    for (const q of notifColumns) {
      await db.execute(sql.raw(q)).catch(() => {});
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "staff_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER,
        "user_email" TEXT NOT NULL,
        "user_name" TEXT,
        "action" TEXT NOT NULL,
        "category" TEXT DEFAULT 'general',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_workspaces" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "template_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "domain" TEXT,
        "customizations" JSONB NOT NULL DEFAULT '{}',
        "settings" JSONB NOT NULL DEFAULT '{}',
        "status" TEXT NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "saved_templates" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "template_id" TEXT NOT NULL,
        "template_name" TEXT NOT NULL,
        "preview_image" TEXT,
        "category" TEXT,
        "custom_config" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    // 4. Support Tickets, Store Customers, Orders, Audit Logs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "store_customers" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "website_id" INTEGER NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "name" TEXT,
        "photo_url" TEXT,
        "favorites" JSONB DEFAULT '[]',
        "last_login_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});
    await db.execute(sql`ALTER TABLE "store_customers" ADD COLUMN IF NOT EXISTS "phone" text;`).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "website_id" INTEGER NOT NULL,
        "customer_email" TEXT NOT NULL,
        "customer_name" TEXT,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "images" JSONB DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" SERIAL PRIMARY KEY,
        "ticket_id" INTEGER NOT NULL,
        "sender_id" TEXT NOT NULL,
        "sender_type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "images" JSONB DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "website_id" INTEGER NOT NULL,
        "customer_name" TEXT,
        "customer_email" TEXT,
        "customer_phone" TEXT,
        "items" JSONB NOT NULL DEFAULT '[]',
        "total" TEXT NOT NULL DEFAULT '0',
        "status" TEXT NOT NULL DEFAULT 'جديد',
        "payment_method" TEXT DEFAULT 'عند الاستلام',
        "delivery_address" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER,
        "user_id" TEXT,
        "action" TEXT NOT NULL,
        "resource_type" TEXT,
        "resource_id" TEXT,
        "changes" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `).catch(() => {});

    // 5. Dentist Template Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "dentist_doctors" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "specialty" TEXT NOT NULL,
        "degree" TEXT,
        "experience" TEXT,
        "image" TEXT,
        "status" TEXT NOT NULL DEFAULT 'نشط',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "dentist_appointments" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "patient_name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "service_id" TEXT,
        "doctor_id" TEXT,
        "service" TEXT,
        "doctor" TEXT,
        "date" TEXT,
        "time" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "dentist_services" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "short_desc" TEXT,
        "full_desc" TEXT,
        "features" JSONB DEFAULT '[]',
        "price" TEXT,
        "duration" TEXT,
        "category" TEXT,
        "image" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "dentist_settings" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER NOT NULL UNIQUE,
        "clinic_name" TEXT NOT NULL DEFAULT 'إيليت دينتال',
        "clinic_phone" TEXT NOT NULL DEFAULT '0790000000',
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `).catch(() => {});

    logger.info('Database auto-schema verification & migration completed successfully!');
  } catch (mErr) {
    console.warn('Auto schema migration notice:', mErr);
  }

  try {
    await ensureTemplateAndAssignmentColumns();

    const existingTemplates = await db.select().from(templates);
    const existingIds = new Set(existingTemplates.map(t => t.id));

    const defaultTemplates = [
      {
        id: 1,
        name: 'قالب المطعم الإيطالي والفاخر',
        description: 'تصميم ملكي راقي مخصص للمطاعم الفاخرة والفاين دايننج، يتيح للعملاء استعراض القائمة الفاخرة، الحجز الفوري للطاولات، وطلب الأطباق بأسلوب احترافي.',
        type: 'native',
        category: 'restaurants',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800',
        defaultContent: {
          logoUrl: 'https://placehold.co/150x50/e11d48/white?text=Logo',
          siteName: 'ن',
          heroTitle: 'تذوق أشهى الأطباق',
          menuItems: [
            { name: 'بيتزا مارغريتا', price: '45 ريال', description: 'صلصة طماطم، موزاريلا، ريحان' },
            { name: 'برجر لحم كلاسيك', price: '35 ريال', description: 'لحم بقري، جبنة، خس، طماطم' },
            { name: 'باستا ألفريدو', price: '40 ريال', description: 'دجاج، فطر، صلصة بيضاء' }
          ],
          businessName: 'مطعم الكلاسيك',
          heroSubtitle: 'تجربة طعام لا تُنسى في قلب المدينة',
          primaryColor: '#e11d48',
          secondaryColor: '#f43f5e'
        }
      },
      {
        id: 2,
        name: 'قالب برجر ستيشن للوجبات السريعة',
        description: 'قالب حيوي وجذاب بمظهر عصري يبرز صور البرجر والوجبات السريعة مع نظام طلب سريع وعروض ترويجية مشهية.',
        type: 'native',
        category: 'restaurants',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800',
        defaultContent: {
          heroTitle: 'طعم لا يُقاوم!',
          metaTitle: 'برجر ستيشن - أشهى الوجبات',
          textColor: '#1f2937',
          fontFamily: 'Tajawal',
          businessName: 'برجر ستيشن',
          heroSubtitle: 'أسرع ديليفري وألذ برجر في المدينة، جربه الآن ولن تندم.',
          primaryColor: '#ff4b2b',
          secondaryColor: '#ffb100'
        }
      },
      {
        id: 3,
        name: 'قالب بيتزا ووجبات عائلية',
        description: 'واجهة متكاملة مخصصة لمطاعم البيتزا والوجبات العائلية مع خيارات مخصصة لتحديد أحجام البيتزا، الإضافات، والمشروبات.',
        type: 'native',
        category: 'restaurants',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
        defaultContent: {
          businessName: 'برجر وسوس',
          heroTitle: 'وجبات سريعة دافية وطازجة!',
          heroSubtitle: 'أسرع توصيل برجر وبيتزا مقرمشة في منطقتك، اطلب الآن واستمتع بالطعمة!',
          primaryColor: '#ef4444',
          secondaryColor: '#fef3c7',
          textColor: '#1f2937',
          fontFamily: 'Tajawal',
          menuItems: [
            { name: 'كلاسيك تشيز برجر', description: 'شريحة لحم بقري مشوية، جبنة شيدر، خس، طماطم، صوص برجر سبيشال', price: '25 ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' },
            { name: 'دبل تربل برجر', description: 'شريحتين لحم أنجوس، جبنة شيدر مضاعفة، بصل مكرمل، صوص المدخن', price: '35 ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' },
            { name: 'بيتزا بيبروني مميزة', description: 'صلصة طماطم إيطالية، جبنة موزاريلا غنية، قطع بيبروني بقري فاخر', price: '40 ريال', category: 'بيتزا', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800' },
            { name: 'بطاطس بالجبنة والهلابينو', description: 'بطاطس مقلية ذهبية مغطاة بصلصة الجبنة الذائبة وشرائح الهلابينو الحارة', price: '15 ريال', category: 'مقبلات', image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=800' }
          ]
        }
      },
      {
        id: 4,
        name: 'قالب كافيه وقهوة كلاسيك',
        description: 'تصميم دافئ وراقي يعكس أجواء المقاهي الكلاسيكية والمخابز الطازجة مع قائمة مشروبات وحلويات تفاعلية.',
        type: 'native',
        category: 'cafes',
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800',
        defaultContent: {
          businessName: 'كافيه أرومار',
          heroTitle: 'لحظات هادئة مع أطيب فنجان قهوة',
          heroSubtitle: 'ننتظرك يومياً لنقدم لك أجود حبوب القهوة المحمصة والمخبوزات الطازجة.',
          primaryColor: '#78350f',
          secondaryColor: '#d97706'
        }
      },
      {
        id: 5,
        name: 'قالب محمص وقهوة مختصة',
        description: 'واجهة عصرية متطورة لعشاق القهوة المختصة والمحمصة، تتيح استعراض إيحاءات البن، مصدر الحبوب، وأدوات التحضير.',
        type: 'native',
        category: 'cafes',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800',
        defaultContent: {
          businessName: 'محمصة الحبة الذهبية',
          heroTitle: 'عالم القهوة المختصة بين يديك',
          heroSubtitle: 'استكشف محاصيلنا الفريدة المستوردة من أرقى مزارع العالم.',
          primaryColor: '#0f172a',
          secondaryColor: '#f59e0b'
        }
      },
      {
        id: 6,
        name: 'قالب بوتيك الحلويات والآيس كريم',
        description: 'تصميم مبهج وملون يبرز كعكات المناسبات، الحلويات الغربية الفاخرة، والآيس كريم بطريقة تجذب الزوار للطلب الفوري.',
        type: 'native',
        category: 'cafes',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800',
        defaultContent: {
          businessName: 'سويت آند مور',
          heroTitle: 'حلاوة تزيد أيامك سعادة وبهجة',
          heroSubtitle: 'أشهى الحلويات والكيك المصنوع بنكهات عالمية.',
          primaryColor: '#db2777',
          secondaryColor: '#f472b6'
        }
      },
      {
        id: 7,
        name: 'قالب العقارات والفلل الفاخرة',
        description: 'تصميم فخم وعصري يعكس الفخامة لتسويق الفلل، القصور، والمشاريع العقارية الاستثمارية الكبرى مع تفاصيل كاملة لكل عقار.',
        type: 'native',
        category: 'realestate',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800',
        defaultContent: {
          businessName: 'مجموعة المروج العقارية',
          heroTitle: 'امتلك منزل أحلامك بتصميم استثنائي',
          heroSubtitle: 'نخبة الفلل والقصور والمشاريع السكنية الفاخرة مع تسهيلات تمويلية ميسرة.',
          primaryColor: '#1e3a8a',
          secondaryColor: '#3b82f6'
        }
      },
      {
        id: 8,
        name: 'قالب الشقق والمجمعات السكنية',
        description: 'واجهة هادئة وعملية لتصفح الشقق المتاحة للإيجار أو الشراء، مع تفاصيل المساحات، المرافق، والتواصل المباشر مع المالك.',
        type: 'native',
        category: 'realestate',
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800',
        defaultContent: {
          businessName: 'أبراج النخبة السكنية',
          heroTitle: 'حياة عصرية متكاملة المرافق',
          heroSubtitle: 'شقق مفروشة وغير مفروشة في أفضل حي بالمدينة مع حراسة ومسبح.',
          primaryColor: '#047857',
          secondaryColor: '#10b981'
        }
      },
      {
        id: 9,
        name: 'قالب المركز والمكتب العقاري الرسمي',
        description: 'قالب مؤسسي رصين يعزز الثقة في خدمات إدارة الأملاك، التثمين العقاري، وتقديم الاستشارات الاستثمارية العقارية.',
        type: 'native',
        category: 'realestate',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
        defaultContent: {
          businessName: 'الوسيط العقاري المعتمد',
          heroTitle: 'شريكك الموثوق في الاستثمار العقاري',
          heroSubtitle: 'إدارة أملاك، تثمين، وبيع وشراء بأعلى عائد استثماري.',
          primaryColor: '#334155',
          secondaryColor: '#64748b'
        }
      },
      {
        id: 10,
        name: 'قالب شركات المقاولات والبناء العام',
        description: 'قالب مهني قوي يبرز المشاريع الإنشائية المنجزة، الخدمات الهندسية، أعمال البناء والتشطيبات الكبرى.',
        type: 'native',
        category: 'contractors',
        image: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800',
        defaultContent: {
          businessName: 'شركة الإتقان للمقاولات',
          heroTitle: 'نبني مستقبلك بأعلى معايير الجودة والهندسة',
          heroSubtitle: 'تنفيذ كافة مشاريع البناء، التشطيب، والترميم بإشراف هندسي صارم.',
          primaryColor: '#b45309',
          secondaryColor: '#f59e0b'
        }
      },
      {
        id: 11,
        name: 'قالب الاستشارات والتصميم المعماري',
        description: 'تصميم عصري وفني يبرز الأفكار المعمارية المبتكرة والمخططات الهندسية ثلاثية الأبعاد 3D.',
        type: 'native',
        category: 'contractors',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800',
        defaultContent: {
          businessName: 'استوديو أركيتكتشر الإبداعي',
          heroTitle: 'نحول أفكارك إلى واقع معماري ينبض بالحياة',
          heroSubtitle: 'تصاميم خارجية وداخلية مبتكرة تجمع بين الجمال والوظيفة.',
          primaryColor: '#0f172a',
          secondaryColor: '#38bdf8'
        }
      },
      {
        id: 12,
        name: 'قالب التصميم الداخلي والتجديد',
        description: 'يعرض أفكار الديكور المودرن والكلاسيك مع ميزة تفاعلية قبل وبعد التعديل (Before & After) لإبراز جودة التشطيبات.',
        type: 'native',
        category: 'contractors',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
        defaultContent: {
          businessName: 'ديكور هوم للدصميم الداخلي',
          heroTitle: 'فخامة الديكور العصري في كل زاوية',
          heroSubtitle: 'نبتكر لك مساحات داخلية تعكس شخصيتك وتمنحك الراحة المطلقة.',
          primaryColor: '#475569',
          secondaryColor: '#94a3b8'
        }
      },
      {
        id: 13,
        name: 'قالب أزياء وبوتيك فاخر (Haute Couture)',
        description: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات مع اختيار الألوان والمقاسات، عربة تسوق ذكية، وتتبع حالات الطلب بدقة.',
        type: 'native',
        category: 'fashion',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800',
        defaultContent: {
          businessName: 'بوتيك الأزياء الراقية',
          heroTitle: 'تصاميم تعكس ذوقك الرفيع',
          heroSubtitle: 'استكشف أحدث تشكيلات الموضة الفاخرة مع تجربة تسوق استثنائية.',
          primaryColor: '#000000',
          secondaryColor: '#ffffff'
        }
      },
      {
        id: 14,
        name: 'متجر الأجهزة الإلكترونية والتقنية',
        description: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية، الحواسيب المحمولة، والإلكترونيات مع خيارات السعة، الألوان، ومساعد ذكي.',
        type: 'native',
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800',
        defaultContent: {
          businessName: 'متجر الأجهزة الإلكترونية',
          heroTitle: 'أحدث الأجهزة الذكية والتقنيات العصرية',
          heroSubtitle: 'عالمك الذكي للتقنية الحديثة بضمان معتمد',
          primaryColor: '#4f46e5',
          secondaryColor: '#818cf8',
          products: [
            {
              id: 1,
              title: 'آيفون 16 برو ماكس - 256 جيجابايت',
              price: 5399,
              originalPrice: 5899,
              category: 'الهواتف الذكية',
              primaryImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800',
              colors: ['التيتانيوم الطبيعي', 'التيتانيوم الأسود', 'فضي معدني'],
              storageOptions: ['256GB', '512GB', '1TB'],
              description: 'شاشة Super Retina XDR مقاس 6.9 بوصة، معالج A18 Pro الخارق.'
            },
            {
              id: 2,
              title: 'ماك بوك برو 16 إنش - M3 Max',
              price: 11499,
              originalPrice: 12499,
              category: 'الحواسيب',
              primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800',
              colors: ['رمادي فلكي', 'فضي معدني'],
              storageOptions: ['512GB SSD', '1TB SSD', '2TB SSD'],
              description: 'أداء استثنائي للمحترفين والمصممين.'
            }
          ]
        }
      },
      {
        id: 15,
        name: 'متجر العناية بالبشرة والجسم',
        description: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم، مع ميزات التسوق السريع، إضافة للمفضلة، وتتبع حالة الطلبات والمنتجات الطبيعية.',
        type: 'native',
        category: 'beauty',
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800',
        defaultContent: {
          businessName: 'متجر العناية والجمال',
          heroTitle: 'اكتشفي جمالك الطبيعي',
          heroSubtitle: 'أفضل منتجات العناية بالبشرة والجسم بمكونات طبيعية 100% لبشرة مشرقة وصحية.',
          primaryColor: '#e11d48',
          secondaryColor: '#fb7185',
          products: [
            {
              id: 1,
              title: 'سيروم حمض الهيالورونيك',
              price: 120,
              originalPrice: 150,
              category: 'العناية بالبشرة',
              primaryImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800',
              description: 'سيروم مرطب بعمق يعيد للبشرة حيويتها ونضارتها ويقلل من الخطوط الدقيقة.',
              stock: 50,
              inventoryStatus: 'متوفر'
            }
          ]
        }
      },
      {
        id: 16,
        name: 'قالب عيادة الأسنان المتقدمة',
        description: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان يتيح للمرضى حجز المواعيد إلكترونياً، استعراض الخدمات الطبية، والتعرف على الفريق الطبي المتخصص.',
        type: 'native',
        category: 'medical',
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800',
        defaultContent: {
          businessName: 'عيادة الأسنان المتقدمة',
          heroTitle: 'ابتسامتك، ثقتك',
          heroSubtitle: 'رعاية أسنان استثنائية لابتسامة أكثر إشراقاً وصحة.',
          primaryColor: '#0284c7',
          secondaryColor: '#38bdf8'
        }
      }
    ];

    for (const template of defaultTemplates) {
      await db.insert(templates).values(template).onConflictDoUpdate({
        target: templates.id,
        set: {
          name: template.name,
          description: template.description,
          category: template.category,
          image: template.image,
          type: template.type,
          defaultContent: template.defaultContent
        }
      });
      logger.info(`Synced template #${template.id}: ${template.name}`);
    }

    logger.info('Finished template verification and seeding!');
  } catch (error) {
    logger.error('Error seeding templates:', error);
  }
}

export const defaultTemplates = [
  {
    id: 1,
    name: 'قالب المطعم الإيطالي والفاخر',
    description: 'تصميم ملكي راقي مخصص للمطاعم الفاخرة والفاين دايننج، يتيح للعملاء استعراض القائمة الفاخرة، الحجز الفوري للطاولات، وطلب الأطباق بأسلوب احترافي.',
    type: 'native',
    category: 'restaurants',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800',
    defaultContent: {
      logoUrl: 'https://placehold.co/150x50/e11d48/white?text=Logo',
      siteName: 'ن',
      heroTitle: 'تذوق أشهى الأطباق',
      menuItems: [
        { name: 'بيتزا مارغريتا', price: '45 ريال', description: 'صلصة طماطم، موزاريلا، ريحان' },
        { name: 'برجر لحم كلاسيك', price: '35 ريال', description: 'لحم بقري، جبنة، خس، طماطم' },
        { name: 'باستا ألفريدو', price: '40 ريال', description: 'دجاج، فطر، صلصة بيضاء' }
      ],
      businessName: 'مطعم الكلاسيك',
      heroSubtitle: 'تجربة طعام لا تُنسى في قلب المدينة',
      primaryColor: '#e11d48',
      secondaryColor: '#f43f5e'
    }
  },
  {
    id: 2,
    name: 'قالب برجر ستيشن للوجبات السريعة',
    description: 'قالب حيوي وجذاب بمظهر عصري يبرز صور البرجر والوجبات السريعة مع نظام طلب سريع وعروض ترويجية مشهية.',
    type: 'native',
    category: 'restaurants',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800',
    defaultContent: {
      heroTitle: 'طعم لا يُقاوم!',
      metaTitle: 'برجر ستيشن - أشهى الوجبات',
      textColor: '#1f2937',
      fontFamily: 'Tajawal',
      businessName: 'برجر ستيشن',
      heroSubtitle: 'أسرع ديليفري وألذ برجر في المدينة، جربه الآن ولن تندم.',
      primaryColor: '#ff4b2b',
      secondaryColor: '#ffb100'
    }
  },
  {
    id: 3,
    name: 'قالب بيتزا ووجبات عائلية',
    description: 'واجهة متكاملة مخصصة لمطاعم البيتزا والوجبات العائلية مع خيارات مخصصة لتحديد أحجام البيتزا، الإضافات، والمشروبات.',
    type: 'native',
    category: 'restaurants',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
    defaultContent: {
      businessName: 'برجر وسوس',
      heroTitle: 'وجبات سريعة دافية وطازجة!',
      heroSubtitle: 'أسرع توصيل برجر وبيتزا مقرمشة في منطقتك، اطلب الآن واستمتع بالطعمة!',
      primaryColor: '#ef4444',
      secondaryColor: '#fef3c7',
      textColor: '#1f2937',
      fontFamily: 'Tajawal',
      menuItems: [
        { name: 'كلاسيك تشيز برجر', description: 'شريحة لحم بقري مشوية، جبنة شيدر، خس، طماطم، صوص برجر سبيشال', price: '25 ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' },
        { name: 'دبل تربل برجر', description: 'شريحتين لحم أنجوس، جبنة شيدر مضاعفة، بصل مكرمل، صوص المدخن', price: '35 ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' },
        { name: 'بيتزا بيبروني مميزة', description: 'صلصة طماطم إيطالية، جبنة موزاريلا غنية، قطع بيبروني بقري فاخر', price: '40 ريال', category: 'بيتزا', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800' },
        { name: 'بطاطس بالجبنة والهلابينو', description: 'بطاطس مقلية ذهبية مغطاة بصلصة الجبنة الذائبة وشرائح الهلابينو الحارة', price: '15 ريال', category: 'مقبلات', image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=800' }
      ]
    }
  },
  {
    id: 4,
    name: 'قالب كافيه وقهوة كلاسيك',
    description: 'تجربة دافئة لعشاق القهوة المختصة والحلويات، مع إبراز حبوب البن المحمصة، نكهات القهوة، وإمكانية الطلب المسبق.',
    type: 'native',
    category: 'restaurants',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800',
    defaultContent: {
      businessName: 'كافيه روستري',
      heroTitle: 'رائحة القهوة الأصيلة في كل صباح',
      heroSubtitle: 'قهوة مختصة محضرة بعناية من أجود حبوب البن العالمية مع تشكيلة حلا طازجة.',
      primaryColor: '#78350f',
      secondaryColor: '#d97706'
    }
  },
  {
    id: 5,
    name: 'قالب المخبز والحلويات الفرنسية',
    description: 'واجهة شهية ومميزة للمخابز ومحلات الحلويات الفاخرة لعرض الكيك المخصص، الكرواسون، والمعجنات مع مواعيد الاستلام.',
    type: 'native',
    category: 'restaurants',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800',
    defaultContent: {
      businessName: 'مخبز وحلويات لا باليت',
      heroTitle: 'كرواسون طازج وحلويات فاخرة كل يوم',
      heroSubtitle: 'معجنات وخبز فرنسي أصيل مخبوز بحب وشغف يومياً.',
      primaryColor: '#c2410c',
      secondaryColor: '#ea580c'
    }
  },
  {
    id: 6,
    name: 'قالب متجر المشروبات والعصائر الطبيعية',
    description: 'تصميم منعش بالألوان الحيوية لعرض العصائر الطازجة والسموذي الصحي وخلطات الديتوكس، مع طلبات سريعة وتوصيل مثلج.',
    type: 'native',
    category: 'restaurants',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800',
    defaultContent: {
      businessName: 'جوس بار المنعش',
      heroTitle: 'انتعاش طبيعي 100% بدون إضافات',
      heroSubtitle: 'عصائر فواكه طبيعية طازجة وخلطات سموذي مغذية تعيد لك الحيوية والنشاط.',
      primaryColor: '#16a34a',
      secondaryColor: '#22c55e'
    }
  },
  {
    id: 7,
    name: 'قالب الفلل والقصور الفاخرة',
    description: 'تصميم فخم واستثنائي مخصص للفلل الراقية والمجمعات السكنية المغلقة، مع جولات تصويرية ومعلومات تفصيلية عن التشطيبات والمساحات.',
    type: 'native',
    category: 'realestate',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800',
    defaultContent: {
      businessName: 'مجموعة المروج العقارية',
      heroTitle: 'امتلك منزل أحلامك بتصميم استثنائي',
      heroSubtitle: 'نخبة الفلل والقصور والمشاريع السكنية الفاخرة مع تسهيلات تمويلية ميسرة.',
      primaryColor: '#1e3a8a',
      secondaryColor: '#3b82f6'
    }
  },
  {
    id: 8,
    name: 'قالب الشقق والمجمعات السكنية',
    description: 'واجهة هادئة وعملية لتصفح الشقق المتاحة للإيجار أو الشراء، مع تفاصيل المساحات، المرافق، والتواصل المباشر مع المالك.',
    type: 'native',
    category: 'realestate',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800',
    defaultContent: {
      businessName: 'أبراج النخبة السكنية',
      heroTitle: 'حياة عصرية متكاملة المرافق',
      heroSubtitle: 'شقق مفروشة وغير مفروشة في أفضل حي بالمدينة مع حراسة ومسبح.',
      primaryColor: '#047857',
      secondaryColor: '#10b981'
    }
  },
  {
    id: 9,
    name: 'قالب المركز والمكتب العقاري الرسمي',
    description: 'قالب مؤسسي رصين يعزز الثقة في خدمات إدارة الأملاك، التثمين العقاري، وتقديم الاستشارات الاستثمارية العقارية.',
    type: 'native',
    category: 'realestate',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
    defaultContent: {
      businessName: 'الوسيط العقاري المعتمد',
      heroTitle: 'شريكك الموثوق في الاستثمار العقاري',
      heroSubtitle: 'إدارة أملاك، تثمين، وبيع وشراء بأعلى عائد استثماري.',
      primaryColor: '#334155',
      secondaryColor: '#64748b'
    }
  },
  {
    id: 10,
    name: 'قالب شركات المقاولات والبناء العام',
    description: 'قالب مهني قوي يبرز المشاريع الإنشائية المنجزة، الخدمات الهندسية، أعمال البناء والتشطيبات الكبرى.',
    type: 'native',
    category: 'contractors',
    image: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800',
    defaultContent: {
      businessName: 'شركة الإتقان للمقاولات',
      heroTitle: 'نبني مستقبلك بأعلى معايير الجودة والهندسة',
      heroSubtitle: 'تنفيذ كافة مشاريع البناء، التشطيب، والترميم بإشراف هندسي صارم.',
      primaryColor: '#b45309',
      secondaryColor: '#f59e0b'
    }
  },
  {
    id: 11,
    name: 'قالب الاستشارات والتصميم المعماري',
    description: 'تصميم عصري وفني يبرز الأفكار المعمارية المبتكرة والمخططات الهندسية ثلاثية الأبعاد 3D.',
    type: 'native',
    category: 'contractors',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800',
    defaultContent: {
      businessName: 'استوديو أركيتكتشر الإبداعي',
      heroTitle: 'نحول أفكارك إلى واقع معماري ينبض بالحياة',
      heroSubtitle: 'تصاميم خارجية وداخلية مبتكرة تجمع بين الجمال والوظيفة.',
      primaryColor: '#0f172a',
      secondaryColor: '#38bdf8'
    }
  },
  {
    id: 12,
    name: 'قالب التصميم الداخلي والتجديد',
    description: 'يعرض أفكار الديكور المودرن والكلاسيك مع ميزة تفاعلية قبل وبعد التعديل (Before & After) لإبراز جودة التشطيبات.',
    type: 'native',
    category: 'contractors',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
    defaultContent: {
      businessName: 'ديكور هوم للدصميم الداخلي',
      heroTitle: 'فخامة الديكور العصري في كل زاوية',
      heroSubtitle: 'نبتكر لك مساحات داخلية تعكس شخصيتك وتمنحك الراحة المطلقة.',
      primaryColor: '#475569',
      secondaryColor: '#94a3b8'
    }
  },
  {
    id: 13,
    name: 'قالب أزياء وبوتيك فاخر (Haute Couture)',
    description: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات مع اختيار الألوان والمقاسات، عربة تسوق ذكية، وتتبع حالات الطلب بدقة.',
    type: 'native',
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800',
    defaultContent: {
      businessName: 'بوتيك الأزياء الراقية',
      heroTitle: 'تصاميم تعكس ذوقك الرفيع',
      heroSubtitle: 'استكشف أحدث تشكيلات الموضة الفاخرة مع تجربة تسوق استثنائية.',
      primaryColor: '#000000',
      secondaryColor: '#ffffff'
    }
  },
  {
    id: 14,
    name: 'متجر الأجهزة الإلكترونية والتقنية',
    description: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية، الحواسيب المحمولة، والإلكترونيات مع خيارات السعة، الألوان، ومساعد ذكي.',
    type: 'native',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800',
    defaultContent: {
      businessName: 'متجر الأجهزة الإلكترونية',
      heroTitle: 'أحدث الأجهزة الذكية والتقنيات العصرية',
      heroSubtitle: 'عالمك الذكي للتقنية الحديثة بضمان معتمد',
      primaryColor: '#4f46e5',
      secondaryColor: '#818cf8',
      products: [
        {
          id: 1,
          title: 'آيفون 16 برو ماكس - 256 جيجابايت',
          price: 5399,
          originalPrice: 5899,
          category: 'الهواتف الذكية',
          primaryImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800',
          colors: ['التيتانيوم الطبيعي', 'التيتانيوم الأسود', 'فضي معدني'],
          storageOptions: ['256GB', '512GB', '1TB'],
          description: 'شاشة Super Retina XDR مقاس 6.9 بوصة، معالج A18 Pro الخارق.'
        },
        {
          id: 2,
          title: 'ماك بوك برو 16 إنش - M3 Max',
          price: 11499,
          originalPrice: 12499,
          category: 'الحواسيب',
          primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800',
          colors: ['رمادي فلكي', 'فضي معدني'],
          storageOptions: ['512GB SSD', '1TB SSD', '2TB SSD'],
          description: 'أداء استثنائي للمحترفين والمصممين.'
        }
      ]
    }
  },
  {
    id: 15,
    name: 'متجر العناية بالبشرة والجسم',
    description: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم، مع ميزات التسوق السريع، إضافة للمفضلة، وتتبع حالة الطلبات والمنتجات الطبيعية.',
    type: 'native',
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800',
    defaultContent: {
      businessName: 'متجر العناية والجمال',
      heroTitle: 'اكتشفي جمالك الطبيعي',
      heroSubtitle: 'أفضل منتجات العناية بالبشرة والجسم بمكونات طبيعية 100% لبشرة مشرقة وصحية.',
      primaryColor: '#e11d48',
      secondaryColor: '#fb7185',
      products: [
        {
          id: 1,
          title: 'سيروم حمض الهيالورونيك',
          price: 120,
          originalPrice: 150,
          category: 'العناية بالبشرة',
          primaryImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800',
          description: 'سيروم مرطب بعمق يعيد للبشرة حيويتها ونضارتها ويقلل من الخطوط الدقيقة.',
          stock: 50,
          inventoryStatus: 'متوفر'
        }
      ]
    }
  },
  {
    id: 16,
    name: 'قالب عيادة الأسنان المتقدمة',
    description: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان يتيح للمرضى حجز المواعيد إلكترونياً، استعراض الخدمات الطبية، والتعرف على الفريق الطبي المتخصص.',
    type: 'native',
    category: 'medical',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800',
    defaultContent: {
      businessName: 'عيادة الأسنان المتقدمة',
      heroTitle: 'ابتسامتك، ثقتك',
      heroSubtitle: 'رعاية أسنان استثنائية لابتسامة أكثر إشراقاً وصحة.',
      primaryColor: '#0284c7',
      secondaryColor: '#38bdf8'
    }
  }
];

export async function ensureTemplateAndAssignmentColumns() {
  try {
    const ddl = [
      `CREATE TABLE IF NOT EXISTS "templates" ("id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL, "description" TEXT, "type" TEXT NOT NULL DEFAULT 'native', "external_url" TEXT, "category" TEXT NOT NULL DEFAULT 'general', "image" TEXT, "default_content" JSONB NOT NULL DEFAULT '{}', "created_at" TIMESTAMP DEFAULT NOW(), "assigned_user_email" TEXT, "deleted_at" TIMESTAMP)`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "description" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'native'`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "external_url" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'general'`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "image" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "default_content" JSONB NOT NULL DEFAULT '{}'`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`,
      `ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
      `CREATE TABLE IF NOT EXISTS "websites" ("id" SERIAL PRIMARY KEY, "tenant_id" INTEGER NOT NULL, "template_id" INTEGER NOT NULL, "created_at" TIMESTAMP DEFAULT NOW(), "assigned_user_email" TEXT, "deleted_at" TIMESTAMP)`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "template_id" INTEGER`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`,
      `ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
      `CREATE TABLE IF NOT EXISTS "website_content" ("id" SERIAL PRIMARY KEY, "website_id" INTEGER NOT NULL, "content" JSONB NOT NULL DEFAULT '{}', "updated_at" TIMESTAMP DEFAULT NOW(), "deleted_at" TIMESTAMP)`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "website_id" INTEGER`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "content" JSONB NOT NULL DEFAULT '{}'`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "website_content" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
      `CREATE TABLE IF NOT EXISTS "subscriptions" ("id" SERIAL PRIMARY KEY, "tenant_id" INTEGER NOT NULL, "plan" TEXT NOT NULL DEFAULT 'monthly', "status" TEXT NOT NULL DEFAULT 'active', "billing_cycle" TEXT, "trial_end" TIMESTAMP, "renewal_date" TIMESTAMP, "payment_provider" TEXT, "has_custom_domain" BOOLEAN NOT NULL DEFAULT false, "requested_domain_name" TEXT, "total_price" INTEGER, "invoice_id" TEXT, "cancelled_at" TIMESTAMP, "created_at" TIMESTAMP DEFAULT NOW(), "assigned_user_email" TEXT)`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'monthly'`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_cycle" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_end" TIMESTAMP`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "renewal_date" TIMESTAMP`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "payment_provider" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "has_custom_domain" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "requested_domain_name" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "total_price" INTEGER`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "invoice_id" TEXT`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "assigned_user_email" TEXT`
    ];
    for (const statement of ddl) {
      await db.execute(sql.raw(statement)).catch(() => {});
    }
  } catch (err) {
    console.warn('ensureTemplateAndAssignmentColumns warning:', err);
  }
}

import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uuid,
  pgEnum,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

// 1. Define Role Enum
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "tenant_admin",
  "staff",
  "user",
  "owner",
  "admin"
]);

// 2. Tenants Table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").unique().notNull(),
  customDomain: text("custom_domain").unique(),
  templateCategory: text("template_category").default("general").notNull(),
  supportedLanguages: text("supported_languages").array(),
  defaultLanguage: text("default_language").default("ar"),
  supportedCurrencies: text("supported_currencies").array(),
  defaultCurrency: text("default_currency").default("SAR"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedUserEmail: text("assigned_user_email"),
  deletedAt: timestamp("deleted_at"),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }), // Kept for backward-compatibility
}, (t) => [
  index("tenant_user_idx").on(t.userId),
  index("tenant_subdomain_idx").on(t.subdomain),
  index("tenant_customdomain_idx").on(t.customDomain),
]);

// 3. Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull().unique(),
  status: text("status").default("active").notNull(), // 'active', 'banned', 'warned'
  
  // Assign Role
  role: text("role").default("user").notNull(),
  name: text("name"),
  permissions: text("permissions").default("all"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  isOnline: integer("is_online").default(1),
  
  // Foreign Key linking user to a specific tenant (Nullable for Super Admin)
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  
  avatarUrl: text("avatar_url"),
  password: text("password"),
  location: text("location"),
  ipAddress: text("ip_address"),
  
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"), // For Soft Deletion support
  assignedUserEmail: text("assigned_user_email"),
  subscriptionType: text("subscription_type"),
  subscriptionPrice: integer("subscription_price"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  quizAnswers: jsonb("quiz_answers"),
}, (t) => [
  index("user_email_idx").on(t.email),
  index("user_uid_idx").on(t.uid),
]);

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("native").notNull(),
  externalUrl: text("external_url"),
  category: text("category").default("general").notNull(),
  image: text("image"),
  defaultContent: jsonb("default_content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  assignedUserEmail: text("assigned_user_email"),
  deletedAt: timestamp("deleted_at"),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  billingCycle: text("billing_cycle"),
  trialEnd: timestamp("trial_end"),
  renewalDate: timestamp("renewal_date"),
  paymentProvider: text("payment_provider"),
  hasCustomDomain: boolean("has_custom_domain").default(false).notNull(),
  requestedDomainName: text("requested_domain_name"),
  totalPrice: integer("total_price"),
  invoiceId: text("invoice_id"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedUserEmail: text("assigned_user_email"),
}, (t) => [
  index("subscription_tenant_idx").on(t.tenantId),
]);

export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  templateId: integer("template_id")
    .references(() => templates.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  assignedUserEmail: text("assigned_user_email"),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("website_tenant_idx").on(t.tenantId),
]);

export const websiteContent = pgTable("website_content", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id")
    .references(() => websites.id, { onDelete: "cascade" })
    .notNull(),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("website_content_idx").on(t.websiteId),
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  websiteId: integer("website_id")
    .references(() => websites.id, { onDelete: "cascade" })
    .notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  status: text("status").default("pending").notNull(),
  type: text("type").notNull(),
  items: jsonb("items"),
  details: jsonb("details"),
  totalPrice: text("total_price"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("order_tenant_idx").on(t.tenantId),
  index("order_website_idx").on(t.websiteId),
]);

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  path: text("path").default("/"),
  elementId: text("element_id"),
  elementText: text("element_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  tenants: many(tenants),
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(users, { fields: [tenants.userId], references: [users.id] }),
  users: many(users),
  subscriptions: many(subscriptions),
  websites: many(websites),
  orders: many(orders),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  websites: many(websites),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  tenant: one(tenants, { fields: [websites.tenantId], references: [tenants.id] }),
  template: one(templates, { fields: [websites.templateId], references: [templates.id] }),
  content: many(websiteContent),
  orders: many(orders),
}));

export const websiteContentRelations = relations(websiteContent, ({ one }) => ({
  website: one(websites, { fields: [websiteContent.websiteId], references: [websites.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  website: one(websites, { fields: [orders.websiteId], references: [websites.id] }),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  targetEmail: text("target_email"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRequired: integer("is_required").default(0),
  isRead: integer("is_read").default(0),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("notification_tenant_idx").on(t.tenantId),
]);

export const staffLogs = pgTable("staff_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  action: text("action").notNull(),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyticsRelations = relations(analytics, ({ one }) => ({
  tenant: one(tenants, { fields: [analytics.tenantId], references: [tenants.id] }),
}));

// ==========================================
// Enterprise Additions: CMS Pages & Posts
// ==========================================

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: jsonb("content").notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("page_tenant_idx").on(t.tenantId),
  index("page_slug_idx").on(t.slug),
]);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: jsonb("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  authorName: text("author_name"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("post_tenant_idx").on(t.tenantId),
  index("post_slug_idx").on(t.slug),
]);

// ==========================================
// Enterprise Additions: Abandoned Carts
// ==========================================

export const cartStatusEnum = pgEnum("cart_status", [
  "pending",
  "notified",
  "recovered",
  "lost",
]);

export const abandonedCarts = pgTable("abandoned_carts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  items: jsonb("items").notNull(),
  totalAmount: text("total_amount").notNull(),
  status: cartStatusEnum("status").default("pending").notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("cart_tenant_idx").on(t.tenantId),
  index("cart_status_idx").on(t.status),
]);

// ==========================================
// Enterprise Additions: Audit Logs
// ==========================================

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("audit_log_tenant_idx").on(t.tenantId),
  index("audit_log_user_idx").on(t.userId),
]);

// ==========================================
// Visual Builder: Client Workspaces & Saved Templates
// ==========================================

export const clientWorkspaces = pgTable("client_workspaces", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain"),
  customizations: jsonb("customizations").notNull(),
  settings: jsonb("settings").default({}).notNull(),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("workspace_user_idx").on(t.userId),
  index("workspace_template_idx").on(t.templateId),
]);

export const savedTemplates = pgTable("saved_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  templateId: text("template_id").notNull(),
  templateName: text("template_name").notNull(),
  previewImage: text("preview_image"),
  category: text("category"),
  customConfig: jsonb("custom_config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("saved_tpl_user_idx").on(t.userId),
]);

export const clientWorkspacesRelations = relations(clientWorkspaces, ({ one }) => ({
  tenant: one(tenants, { fields: [clientWorkspaces.templateId], references: [tenants.id] }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  tenant: one(tenants, { fields: [pages.tenantId], references: [tenants.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  tenant: one(tenants, { fields: [posts.tenantId], references: [tenants.id] }),
}));

export const abandonedCartsRelations = relations(abandonedCarts, ({ one }) => ({
  tenant: one(tenants, { fields: [abandonedCarts.tenantId], references: [tenants.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
}));


export const storeCustomers = pgTable("store_customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  websiteId: integer("website_id")
    .references(() => websites.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  name: text("name"),
  photoUrl: text("photo_url"),
  favorites: jsonb("favorites").default('[]'),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storeCustomersRelations = relations(storeCustomers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [storeCustomers.tenantId], references: [tenants.id] }),
  website: one(websites, { fields: [storeCustomers.websiteId], references: [websites.id] }),
}));

// ==========================================
// Support Tickets & Chats
// ==========================================

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  websiteId: integer("website_id")
    .references(() => websites.id, { onDelete: "cascade" })
    .notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, closed
  images: jsonb("images").default('[]'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .references(() => supportTickets.id, { onDelete: "cascade" })
    .notNull(),
  senderId: text("sender_id").notNull(), // email or user id
  senderType: text("sender_type").notNull(), // 'customer' | 'staff'
  message: text("message").notNull(),
  images: jsonb("images").default('[]'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  tenant: one(tenants, { fields: [supportTickets.tenantId], references: [tenants.id] }),
  website: one(websites, { fields: [supportTickets.websiteId], references: [websites.id] }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [supportMessages.ticketId], references: [supportTickets.id] }),
}));

// ==========================================
// Dental Clinic Template Tables (Multi-tenant)
// ==========================================

export const dentistDoctors = pgTable("dentist_doctors", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  passwordHash: text("password_hash"),
  specialty: text("specialty").notNull(),
  degree: text("degree"),
  experience: text("experience"),
  image: text("image"),
  status: text("status").default("نشط").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("dentist_doctor_tenant_idx").on(t.tenantId),
]);

export const doctorAvailability = pgTable("doctor_availability", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  doctorId: integer("doctor_id").references(() => dentistDoctors.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: text("day_of_week").notNull(), // 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  startTime: text("start_time").default("09:00").notNull(), // e.g. '09:00'
  endTime: text("end_time").default("17:00").notNull(), // e.g. '17:00'
  slotDurationMinutes: integer("slot_duration_minutes").default(30).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("doctor_avail_tenant_doc_idx").on(t.tenantId, t.doctorId),
]);

export const dentistAppointments = pgTable("dentist_appointments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  serviceId: text("service_id"),
  doctorId: text("doctor_id"),
  service: text("service"),
  doctor: text("doctor"),
  date: text("date"),
  time: text("time"),
  confirmedTime: text("confirmed_time"),
  doctorNotes: text("doctor_notes"),
  status: text("status").default("pending").notNull(), // pending, confirmed, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("dentist_appointment_tenant_idx").on(t.tenantId),
]);

export const dentistServices = pgTable("dentist_services", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  shortDesc: text("short_desc"),
  fullDesc: text("full_desc"),
  features: jsonb("features").default('[]'),
  price: text("price"),
  duration: text("duration"),
  category: text("category"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("dentist_service_tenant_idx").on(t.tenantId),
]);

export const dentistSettings = pgTable("dentist_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull().unique(),
  clinicName: text("clinic_name").default("إيليت دينتال").notNull(),
  clinicPhone: text("clinic_phone").default("0790000000").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("dentist_setting_tenant_idx").on(t.tenantId),
]);


import { pgTable, bigserial, bigint, varchar, timestamp, integer, text, boolean, numeric, date, time, primaryKey, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const offices = pgTable("d_cpm_offices", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  officeName: varchar("office_name").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const officesRelations = relations(offices, ({ many }) => ({
  clients: many(clients),
}));

export const clients = pgTable("d_cpm_clients", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  clientType: varchar("client_type").notNull(), // INDIVIDUAL or ORGANIZATION
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  organizationName: varchar("organization_name"),
  officeId: bigint("office_id", { mode: "bigint" }).references(() => offices.id, { onDelete: "restrict" }),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  office: one(offices, { fields: [clients.officeId], references: [offices.id] }),
  orders: many(orders),
}));

export const venues = pgTable("d_cpm_venues", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  venueName: varchar("venue_name").unique().notNull(),
  capacity: integer("capacity").notNull(),
  physicalAddress: text("physical_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const venuesRelations = relations(venues, ({ many }) => ({
  orders: many(orders),
}));

export const serviceTypes = pgTable("d_cpm_service_types", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  serviceName: varchar("service_name").unique().notNull(), // Packed | Buffet | Delivery
});

export const serviceTypesRelations = relations(serviceTypes, ({ many }) => ({
  orders: many(orders),
}));

export const orderStatuses = pgTable("d_cpm_order_status", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  statusName: varchar("status_name").unique().notNull(), // DRAFT | PENDING | APPROVED | etc
});

export const orderStatusesRelations = relations(orderStatuses, ({ many }) => ({
  orders: many(orders),
  historyFrom: many(orderHistory, { relationName: "fromStatus" }),
  historyTo: many(orderHistory, { relationName: "toStatus" }),
}));

export const menus = pgTable("d_cpm_menus", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  title: varchar("title").unique().notNull(),
  description: text("description"),
  baseRate: numeric("base_rate", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menusRelations = relations(menus, ({ many }) => ({
  menuItems: many(menuItems),
  mealPeriods: many(mealPeriods),
}));

export const items = pgTable("d_cpm_items", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  itemName: varchar("item_name").unique().notNull(),
  category: varchar("category").notNull(),
});

export const itemsRelations = relations(items, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItems = pgTable("bridge_cpm_menu_items", {
  menuId: bigint("menu_id", { mode: "bigint" }).references(() => menus.id, { onDelete: "restrict" }).notNull(),
  itemId: bigint("item_id", { mode: "bigint" }).references(() => items.id, { onDelete: "restrict" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.menuId, table.itemId] })
]);

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, { fields: [menuItems.menuId], references: [menus.id] }),
  item: one(items, { fields: [menuItems.itemId], references: [items.id] }),
}));

export const orders = pgTable("f_cpm_orders", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  clientId: bigint("client_id", { mode: "bigint" }).references(() => clients.id, { onDelete: "restrict" }).notNull(),
  venueId: bigint("venue_id", { mode: "bigint" }).references(() => venues.id, { onDelete: "restrict" }),
  customDeliveryAddress: text("custom_delivery_address"),
  serviceTypeId: bigint("service_type_id", { mode: "bigint" }).references(() => serviceTypes.id, { onDelete: "restrict" }).notNull(),
  statusId: bigint("status_id", { mode: "bigint" }).references(() => orderStatuses.id, { onDelete: "restrict" }).notNull(),
  ingressTime: time("ingress_time"),
  egressTime: time("egress_time"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pdfGeneratedFlag: boolean("pdf_generated_flag").default(false).notNull(),
  pdfFilePath: varchar("pdf_file_path"),
  specialInstructions: text("special_instructions"),
  createdByUserId: bigint("created_by_user_id", { mode: "bigint" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  venue: one(venues, { fields: [orders.venueId], references: [venues.id] }),
  serviceType: one(serviceTypes, { fields: [orders.serviceTypeId], references: [serviceTypes.id] }),
  status: one(orderStatuses, { fields: [orders.statusId], references: [orderStatuses.id] }),
  orderDays: many(orderDays),
  history: many(orderHistory),
}));

export const orderDays = pgTable("bridge_cpm_order_days", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  orderId: bigint("order_id", { mode: "bigint" }).references(() => orders.id, { onDelete: "cascade" }).notNull(),
  eventDate: date("event_date").notNull(),
}, (table) => [
  unique("bridge_cpm_order_days_order_id_event_date_key").on(table.orderId, table.eventDate)
]);

export const orderDaysRelations = relations(orderDays, ({ one, many }) => ({
  order: one(orders, { fields: [orderDays.orderId], references: [orders.id] }),
  mealPeriods: many(mealPeriods),
}));

export const mealPeriods = pgTable("bridge_cpm_meal_periods", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  orderDayId: bigint("order_day_id", { mode: "bigint" }).references(() => orderDays.id, { onDelete: "cascade" }).notNull(),
  menuId: bigint("menu_id", { mode: "bigint" }).references(() => menus.id, { onDelete: "restrict" }),
  pax: integer("pax").notNull(),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull(),
  mealPeriod: varchar("meal_period").notNull(),
  customName: varchar("custom_name"),
});

export const mealPeriodItems = pgTable("bridge_cpm_meal_period_items", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  mealPeriodId: bigint("meal_period_id", { mode: "bigint" }).references(() => mealPeriods.id, { onDelete: "cascade" }).notNull(),
  itemId: bigint("item_id", { mode: "bigint" }).references(() => items.id, { onDelete: "restrict" }).notNull(),
});

export const mealPeriodsRelations = relations(mealPeriods, ({ one, many }) => ({
  orderDay: one(orderDays, { fields: [mealPeriods.orderDayId], references: [orderDays.id] }),
  menu: one(menus, { fields: [mealPeriods.menuId], references: [menus.id] }),
  mealPeriodItems: many(mealPeriodItems),
}));

export const mealPeriodItemsRelations = relations(mealPeriodItems, ({ one }) => ({
  mealPeriod: one(mealPeriods, { fields: [mealPeriodItems.mealPeriodId], references: [mealPeriods.id] }),
  item: one(items, { fields: [mealPeriodItems.itemId], references: [items.id] }),
}));

export const orderHistory = pgTable("f_cpm_order_history", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  orderId: bigint("order_id", { mode: "bigint" }).references(() => orders.id, { onDelete: "cascade" }).notNull(),
  fromStatusId: bigint("from_status_id", { mode: "bigint" }).references(() => orderStatuses.id, { onDelete: "restrict" }).notNull(),
  toStatusId: bigint("to_status_id", { mode: "bigint" }).references(() => orderStatuses.id, { onDelete: "restrict" }).notNull(),
  changedByUserId: bigint("changed_by_user_id", { mode: "bigint" }).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderHistoryRelations = relations(orderHistory, ({ one }) => ({
  order: one(orders, { fields: [orderHistory.orderId], references: [orders.id] }),
  fromStatus: one(orderStatuses, { fields: [orderHistory.fromStatusId], references: [orderStatuses.id], relationName: "fromStatus" }),
  toStatus: one(orderStatuses, { fields: [orderHistory.toStatusId], references: [orderStatuses.id], relationName: "toStatus" }),
}));

export const users = pgTable("d_cpm_users", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").notNull(), // USER or ADMIN
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userPw: varchar('user_pw', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  birth: date('birth'),
  gender: varchar('gender', { length: 10 }),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const guests = pgTable('guests', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
});
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  isOpen: boolean('is_open').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export const storeAddresses = pgTable('store_addresses', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  address: text('address'),
  detailAddress: text('detail_address'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
});

export const insertStoreAddressSchema = createInsertSchema(storeAddresses).omit({
  id: true,
});
export type InsertStoreAddress = z.infer<typeof insertStoreAddressSchema>;
export type StoreAddress = typeof storeAddresses.$inferSelect;

export const storeInfo = pgTable('store_info', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  category: varchar('category', { length: 100 }),
  ratingAverage: varchar('rating_average', { length: 10 }),
  reviewCount: integer('review_count').default(0),
  description: text('description'),
  phoneNumber: varchar('phone_number', { length: 50 }),
  imageUrl: text('image_url'),
});

export const insertStoreInfoSchema = createInsertSchema(storeInfo).omit({
  id: true,
});
export type InsertStoreInfo = z.infer<typeof insertStoreInfoSchema>;
export type StoreInfo = typeof storeInfo.$inferSelect;

export const storeMenu = pgTable('store_menu', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  categoryName: varchar('category_name', { length: 100 }),
  menuName: varchar('menu_name', { length: 255 }).notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  cookStation: varchar('cook_station', { length: 50 }),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertStoreMenuSchema = createInsertSchema(storeMenu).omit({
  id: true,
  createdAt: true,
});
export type InsertStoreMenu = z.infer<typeof insertStoreMenuSchema>;
export type StoreMenu = typeof storeMenu.$inferSelect;

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  userId: integer('user_id'),
  guestPhone: varchar('guest_phone', { length: 255 }),
  source: varchar('source', { length: 50 }).notNull(),
  sessionStatus: varchar('session_status', { length: 50 }).default('OPEN').notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('UNPAID').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  totalPrice: integer('total_price').default(0),
  tableNum: integer('table_num'),
  sessionEnded: boolean('session_ended').default(false),
  sessionEndedAt: timestamp('session_ended_at'),
  isMixed: boolean('is_mixed').default(false),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderTickets = pgTable('order_tickets', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING'),
  batchNo: integer('batch_no'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertOrderTicketSchema = createInsertSchema(orderTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderTicket = z.infer<typeof insertOrderTicketSchema>;
export type OrderTicket = typeof orderTickets.$inferSelect;

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull(),
  menuId: integer('menu_id').notNull(),
  menuName: varchar('menu_name', { length: 255 }),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: integer('unit_price').default(0),
  totalPrice: integer('total_price').notNull(),
  itemStatus: varchar('item_status', { length: 50 }).default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
  cookStation: varchar('cook_station', { length: 50 }),
  cancelReason: text('cancel_reason'),
  storeId: integer('store_id').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  options: jsonb('options'),
  orderId: integer('order_id').notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  method: varchar('method', { length: 50 }).notNull(),
  amount: integer('amount').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
  paidAt: timestamp('paid_at'),
  tossPaymentKey: varchar('toss_payment_key', { length: 255 }),
  tossOrderId: varchar('toss_order_id', { length: 255 }),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  userId: integer('user_id').notNull(),
  rating: integer('rating').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
  imageUrl: text('image_url'),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  storeId: integer('store_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  relatedId: integer('related_id'),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

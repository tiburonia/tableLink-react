import { eq, and, desc } from 'drizzle-orm';
import { db } from './db.js';
import * as schema from '../shared/schema.js';

class DbStorage {
  // User operations
  async createUser(user) {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async getUserById(id) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUserId(userId) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.userId, userId));
    return user;
  }

  async getUserByPhone(phone) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone));
    return user;
  }

  async updateUser(id, user) {
    const [updated] = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return updated;
  }

  // Guest operations
  async createGuest(guest) {
    const [newGuest] = await db.insert(schema.guests).values(guest).returning();
    return newGuest;
  }

  async getGuestByPhone(phone) {
    const [guest] = await db.select().from(schema.guests).where(eq(schema.guests.phone, phone));
    return guest;
  }

  // Store operations
  async getAllStores() {
    return await db.select().from(schema.stores);
  }

  async getStoreById(id) {
    const [store] = await db.select().from(schema.stores).where(eq(schema.stores.id, id));
    return store;
  }

  async createStore(store) {
    const [newStore] = await db.insert(schema.stores).values(store).returning();
    return newStore;
  }

  async updateStore(id, store) {
    const [updated] = await db.update(schema.stores).set(store).where(eq(schema.stores.id, id)).returning();
    return updated;
  }

  // Store Address operations
  async getStoreAddress(storeId) {
    const [address] = await db.select().from(schema.storeAddresses).where(eq(schema.storeAddresses.storeId, storeId));
    return address;
  }

  async createStoreAddress(address) {
    const [newAddress] = await db.insert(schema.storeAddresses).values(address).returning();
    return newAddress;
  }

  async updateStoreAddress(storeId, address) {
    const [updated] = await db.update(schema.storeAddresses).set(address).where(eq(schema.storeAddresses.storeId, storeId)).returning();
    return updated;
  }

  // Store Info operations
  async getStoreInfo(storeId) {
    const [info] = await db.select().from(schema.storeInfo).where(eq(schema.storeInfo.storeId, storeId));
    return info;
  }

  async createStoreInfo(info) {
    const [newInfo] = await db.insert(schema.storeInfo).values(info).returning();
    return newInfo;
  }

  async updateStoreInfo(storeId, info) {
    const [updated] = await db.update(schema.storeInfo).set(info).where(eq(schema.storeInfo.storeId, storeId)).returning();
    return updated;
  }

  // Store Menu operations
  async getStoreMenu(storeId) {
    return await db.select().from(schema.storeMenu).where(eq(schema.storeMenu.storeId, storeId));
  }

  async getMenuItemById(id) {
    const [item] = await db.select().from(schema.storeMenu).where(eq(schema.storeMenu.id, id));
    return item;
  }

  async createMenuItem(item) {
    const [newItem] = await db.insert(schema.storeMenu).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id, item) {
    const [updated] = await db.update(schema.storeMenu).set(item).where(eq(schema.storeMenu.id, id)).returning();
    return updated;
  }

  // Order operations
  async createOrder(order) {
    const [newOrder] = await db.insert(schema.orders).values(order).returning();
    return newOrder;
  }

  async getOrderById(id) {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return order;
  }

  async getOrdersByStoreId(storeId) {
    return await db.select().from(schema.orders).where(eq(schema.orders.storeId, storeId)).orderBy(desc(schema.orders.createdAt));
  }

  async getOrdersByUserId(userId) {
    return await db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt));
  }

  async updateOrder(id, order) {
    const [updated] = await db.update(schema.orders).set(order).where(eq(schema.orders.id, id)).returning();
    return updated;
  }

  // Order Ticket operations
  async createOrderTicket(ticket) {
    const [newTicket] = await db.insert(schema.orderTickets).values(ticket).returning();
    return newTicket;
  }

  async getOrderTicketsByOrderId(orderId) {
    return await db.select().from(schema.orderTickets).where(eq(schema.orderTickets.orderId, orderId));
  }

  // Order Item operations
  async createOrderItem(item) {
    const [newItem] = await db.insert(schema.orderItems).values(item).returning();
    return newItem;
  }

  async getOrderItemsByTicketId(ticketId) {
    return await db.select().from(schema.orderItems).where(eq(schema.orderItems.ticketId, ticketId));
  }

  async getOrderItemsByOrderId(orderId) {
    return await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  }

  async updateOrderItem(id, item) {
    const [updated] = await db.update(schema.orderItems).set(item).where(eq(schema.orderItems.id, id)).returning();
    return updated;
  }

  // Payment operations
  async createPayment(payment) {
    const [newPayment] = await db.insert(schema.payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentByOrderId(orderId) {
    const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId));
    return payment;
  }

  async updatePayment(id, payment) {
    const [updated] = await db.update(schema.payments).set(payment).where(eq(schema.payments.id, id)).returning();
    return updated;
  }

  // Review operations
  async createReview(review) {
    const [newReview] = await db.insert(schema.reviews).values(review).returning();
    return newReview;
  }

  async getReviewsByStoreId(storeId) {
    return await db.select().from(schema.reviews).where(eq(schema.reviews.storeId, storeId)).orderBy(desc(schema.reviews.createdAt));
  }

  async getReviewsByUserId(userId) {
    return await db.select().from(schema.reviews).where(eq(schema.reviews.userId, userId)).orderBy(desc(schema.reviews.createdAt));
  }

  // Favorite operations
  async createFavorite(favorite) {
    const [newFavorite] = await db.insert(schema.favorites).values(favorite).returning();
    return newFavorite;
  }

  async getFavoritesByUserId(userId) {
    return await db.select().from(schema.favorites).where(eq(schema.favorites.userId, userId));
  }

  async deleteFavorite(userId, storeId) {
    await db.delete(schema.favorites).where(
      and(
        eq(schema.favorites.userId, userId),
        eq(schema.favorites.storeId, storeId)
      )
    );
  }

  async isFavorite(userId, storeId) {
    const [favorite] = await db.select().from(schema.favorites).where(
      and(
        eq(schema.favorites.userId, userId),
        eq(schema.favorites.storeId, storeId)
      )
    );
    return !!favorite;
  }

  // Notification operations
  async createNotification(notification) {
    const [newNotification] = await db.insert(schema.notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUserId(userId) {
    return await db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationAsRead(id) {
    await db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.id, id));
  }
}

export const storage = new DbStorage();

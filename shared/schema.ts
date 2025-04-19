import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Table definitions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  imageUrl: text("image_url"),  // Added for consistency with BookmarkWithTags
  domain: text("domain"),
  favorite: boolean("favorite").default(false),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const bookmarkTags = pgTable("bookmark_tags", {
  bookmarkId: integer("bookmark_id").notNull().references(() => bookmarks.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookmarkId, t.tagId] }),
}));

// Relation definitions
export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const foldersRelations = relations(folders, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one, many }) => ({
  folder: one(folders, {
    fields: [bookmarks.folderId],
    references: [folders.id],
  }),
  tags: many(bookmarkTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  bookmarks: many(bookmarkTags),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

export const insertBookmarkTagSchema = createInsertSchema(bookmarkTags);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type BookmarkTag = typeof bookmarkTags.$inferSelect;
export type InsertBookmarkTag = z.infer<typeof insertBookmarkTagSchema>;

// Extended types for frontend use
export type BookmarkWithTags = Omit<Bookmark, 'updatedAt'> & {
  tags: Tag[];
  folder?: Folder;
  imageUrl?: string | null; // For articles from RSS/crawler with image URLs
  category?: string; // For categorizing news articles
  source?: {
    id: string;
    name: string;
    iconUrl?: string;
  }; // Source info for news articles
  updatedAt?: Date | null; // For news articles
};

export type FolderWithCount = Folder & {
  count: number;
};

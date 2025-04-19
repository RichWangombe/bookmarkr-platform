import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  domain: text("domain"),
  favorite: boolean("favorite").default(false),
  folderId: integer("folder_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

export const bookmarkTags = pgTable("bookmark_tags", {
  id: serial("id").primaryKey(),
  bookmarkId: integer("bookmark_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertBookmarkTagSchema = createInsertSchema(bookmarkTags).omit({
  id: true,
});

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
export type BookmarkWithTags = Bookmark & {
  tags: Tag[];
  folder?: Folder;
};

export type FolderWithCount = Folder & {
  count: number;
};

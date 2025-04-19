import {
  users, bookmarks, folders, tags, bookmarkTags,
  type User, type InsertUser,
  type Bookmark, type InsertBookmark,
  type Folder, type InsertFolder,
  type Tag, type InsertTag,
  type BookmarkTag, type InsertBookmarkTag,
  type BookmarkWithTags, type FolderWithCount
} from "@shared/schema";
import { db } from "./db";
import { and, eq, ilike, or, sql, count, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bookmark operations
  getAllBookmarks(): Promise<BookmarkWithTags[]>;
  getBookmarkById(id: number): Promise<BookmarkWithTags | undefined>;
  getBookmarksByFolder(folderId: number | null): Promise<BookmarkWithTags[]>;
  getBookmarksByTag(tagId: number): Promise<BookmarkWithTags[]>;
  getFavoriteBookmarks(): Promise<BookmarkWithTags[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: number): Promise<boolean>;
  searchBookmarks(query: string): Promise<BookmarkWithTags[]>;
  
  // Folder operations
  getAllFolders(): Promise<FolderWithCount[]>;
  getFolderById(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  
  // BookmarkTag operations
  addTagToBookmark(bookmarkId: number, tagId: number): Promise<void>;
  removeTagFromBookmark(bookmarkId: number, tagId: number): Promise<void>;
  getTagsForBookmark(bookmarkId: number): Promise<Tag[]>;
  getBookmarksForTag(tagId: number): Promise<Bookmark[]>;
}

// Implementation of IStorage using a PostgreSQL database
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllBookmarks(): Promise<BookmarkWithTags[]> {
    const result = await db.query.bookmarks.findMany({
      with: {
        folder: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
    
    return result.map((bookmark) => ({
      ...bookmark,
      tags: bookmark.tags.map((bookmarkTag) => bookmarkTag.tag),
    }));
  }

  async getBookmarkById(id: number): Promise<BookmarkWithTags | undefined> {
    const bookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, id),
      with: {
        folder: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
    
    if (!bookmark) return undefined;
    
    return {
      ...bookmark,
      tags: bookmark.tags.map((bookmarkTag) => bookmarkTag.tag),
    };
  }

  async getBookmarksByFolder(folderId: number | null): Promise<BookmarkWithTags[]> {
    let query;
    
    if (folderId === null) {
      query = isNull(bookmarks.folderId);
    } else {
      query = eq(bookmarks.folderId, folderId);
    }
    
    const result = await db.query.bookmarks.findMany({
      where: query,
      with: {
        folder: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
    
    return result.map((bookmark) => ({
      ...bookmark,
      tags: bookmark.tags.map((bookmarkTag) => bookmarkTag.tag),
    }));
  }

  async getBookmarksByTag(tagId: number): Promise<BookmarkWithTags[]> {
    const result = await db.query.bookmarks.findMany({
      with: {
        folder: true,
        tags: {
          where: eq(bookmarkTags.tagId, tagId),
          with: {
            tag: true,
          },
        },
      },
    });
    
    return result.filter(bookmark => bookmark.tags.length > 0).map((bookmark) => ({
      ...bookmark,
      tags: bookmark.tags.map((bookmarkTag) => bookmarkTag.tag),
    }));
  }

  async getFavoriteBookmarks(): Promise<BookmarkWithTags[]> {
    const result = await db.query.bookmarks.findMany({
      where: eq(bookmarks.favorite, true),
      with: {
        folder: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
    
    return result.map((bookmark) => ({
      ...bookmark,
      tags: bookmark.tags.map((bookmarkTag) => bookmarkTag.tag),
    }));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values(insertBookmark)
      .returning();
    return bookmark;
  }

  async updateBookmark(id: number, updateData: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const [updatedBookmark] = await db
      .update(bookmarks)
      .set(updateData)
      .where(eq(bookmarks.id, id))
      .returning();
    
    return updatedBookmark || undefined;
  }

  async deleteBookmark(id: number): Promise<boolean> {
    const [deletedBookmark] = await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, id))
      .returning();
    
    return !!deletedBookmark;
  }

  async searchBookmarks(query: string): Promise<BookmarkWithTags[]> {
    const searchTerm = `%${query}%`;
    
    const result = await db.query.bookmarks.findMany({
      where: or(
        ilike(bookmarks.title, searchTerm),
        ilike(bookmarks.description || "", searchTerm),
        ilike(bookmarks.url, searchTerm)
      ),
      with: {
        folder: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });
    
    return result.map((bookmark) => ({
      ...bookmark,
      tags: bookmark.tags.map((bookmarkTag) => bookmarkTag.tag),
    }));
  }

  async getAllFolders(): Promise<FolderWithCount[]> {
    const foldersWithCount = await db
      .select({
        id: folders.id,
        name: folders.name,
        color: folders.color,
        count: count(bookmarks.id).as('count')
      })
      .from(folders)
      .leftJoin(bookmarks, eq(folders.id, bookmarks.folderId))
      .groupBy(folders.id)
      .orderBy(folders.name);
    
    return foldersWithCount.map(folder => ({
      ...folder,
      count: Number(folder.count), // Ensure count is a number
    }));
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values(insertFolder)
      .returning();
    return folder;
  }

  async updateFolder(id: number, updateData: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [updatedFolder] = await db
      .update(folders)
      .set(updateData)
      .where(eq(folders.id, id))
      .returning();
    
    return updatedFolder || undefined;
  }

  async deleteFolder(id: number): Promise<boolean> {
    // First update any bookmarks that refer to this folder to have null folderId
    await db
      .update(bookmarks)
      .set({ folderId: null })
      .where(eq(bookmarks.folderId, id));
    
    const [deletedFolder] = await db
      .delete(folders)
      .where(eq(folders.id, id))
      .returning();
    
    return !!deletedFolder;
  }

  async getAllTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.name, name));
    return tag || undefined;
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values(insertTag)
      .returning();
    return tag;
  }

  async addTagToBookmark(bookmarkId: number, tagId: number): Promise<void> {
    // Check if the relationship already exists
    const [existingRelation] = await db
      .select()
      .from(bookmarkTags)
      .where(and(
        eq(bookmarkTags.bookmarkId, bookmarkId),
        eq(bookmarkTags.tagId, tagId)
      ));
    
    if (!existingRelation) {
      await db
        .insert(bookmarkTags)
        .values({ bookmarkId, tagId });
    }
  }

  async removeTagFromBookmark(bookmarkId: number, tagId: number): Promise<void> {
    await db
      .delete(bookmarkTags)
      .where(and(
        eq(bookmarkTags.bookmarkId, bookmarkId),
        eq(bookmarkTags.tagId, tagId)
      ));
  }

  async getTagsForBookmark(bookmarkId: number): Promise<Tag[]> {
    const result = await db
      .select({
        tag: tags
      })
      .from(bookmarkTags)
      .where(eq(bookmarkTags.bookmarkId, bookmarkId))
      .innerJoin(tags, eq(bookmarkTags.tagId, tags.id));
    
    return result.map(row => row.tag);
  }

  async getBookmarksForTag(tagId: number): Promise<Bookmark[]> {
    const result = await db
      .select({
        bookmark: bookmarks
      })
      .from(bookmarkTags)
      .where(eq(bookmarkTags.tagId, tagId))
      .innerJoin(bookmarks, eq(bookmarkTags.bookmarkId, bookmarks.id));
    
    return result.map(row => row.bookmark);
  }
}

export const storage = new DatabaseStorage();
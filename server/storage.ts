import {
  users, bookmarks, folders, tags, bookmarkTags,
  type User, type InsertUser,
  type Bookmark, type InsertBookmark,
  type Folder, type InsertFolder,
  type Tag, type InsertTag,
  type BookmarkTag, type InsertBookmarkTag,
  type BookmarkWithTags, type FolderWithCount
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookmarks: Map<number, Bookmark>;
  private folders: Map<number, Folder>;
  private tags: Map<number, Tag>;
  private bookmarkTags: Map<number, BookmarkTag>;
  
  private userIdCounter: number;
  private bookmarkIdCounter: number;
  private folderIdCounter: number;
  private tagIdCounter: number;
  private bookmarkTagIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.bookmarks = new Map();
    this.folders = new Map();
    this.tags = new Map();
    this.bookmarkTags = new Map();
    
    this.userIdCounter = 1;
    this.bookmarkIdCounter = 1;
    this.folderIdCounter = 1;
    this.tagIdCounter = 1;
    this.bookmarkTagIdCounter = 1;
    
    // Initialize with some default folders
    this.createFolder({ name: "Development", color: "#4A90E2" });
    this.createFolder({ name: "Design Inspiration", color: "#6C63FF" });
    this.createFolder({ name: "Articles to Read", color: "#4CAF50" });
    
    // Initialize with some default tags
    this.createTag({ name: "javascript" });
    this.createTag({ name: "design" });
    this.createTag({ name: "productivity" });
    this.createTag({ name: "learning" });
    this.createTag({ name: "inspiration" });
    this.createTag({ name: "technology" });
    this.createTag({ name: "programming" });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Bookmark operations
  async getAllBookmarks(): Promise<BookmarkWithTags[]> {
    const bookmarks = Array.from(this.bookmarks.values());
    return Promise.all(bookmarks.map(bookmark => this.enrichBookmark(bookmark)));
  }
  
  async getBookmarkById(id: number): Promise<BookmarkWithTags | undefined> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return undefined;
    return this.enrichBookmark(bookmark);
  }
  
  async getBookmarksByFolder(folderId: number | null): Promise<BookmarkWithTags[]> {
    const bookmarks = Array.from(this.bookmarks.values())
      .filter(bookmark => 
        folderId === null 
          ? bookmark.folderId === undefined || bookmark.folderId === null
          : bookmark.folderId === folderId
      );
    
    return Promise.all(bookmarks.map(bookmark => this.enrichBookmark(bookmark)));
  }
  
  async getBookmarksByTag(tagId: number): Promise<BookmarkWithTags[]> {
    const bookmarkIds = Array.from(this.bookmarkTags.values())
      .filter(bt => bt.tagId === tagId)
      .map(bt => bt.bookmarkId);
    
    const bookmarks = bookmarkIds
      .map(id => this.bookmarks.get(id))
      .filter(bookmark => bookmark !== undefined) as Bookmark[];
    
    return Promise.all(bookmarks.map(bookmark => this.enrichBookmark(bookmark)));
  }
  
  async getFavoriteBookmarks(): Promise<BookmarkWithTags[]> {
    const bookmarks = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.favorite);
    
    return Promise.all(bookmarks.map(bookmark => this.enrichBookmark(bookmark)));
  }
  
  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkIdCounter++;
    const now = new Date();
    const bookmark: Bookmark = { ...insertBookmark, id, createdAt: now };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }
  
  async updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const existingBookmark = this.bookmarks.get(id);
    if (!existingBookmark) return undefined;
    
    const updatedBookmark = { ...existingBookmark, ...bookmark };
    this.bookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }
  
  async deleteBookmark(id: number): Promise<boolean> {
    // Delete associated bookmark tags
    const bookmarkTagsToDelete = Array.from(this.bookmarkTags.values())
      .filter(bt => bt.bookmarkId === id);
    
    for (const bt of bookmarkTagsToDelete) {
      this.bookmarkTags.delete(bt.id);
    }
    
    return this.bookmarks.delete(id);
  }
  
  async searchBookmarks(query: string): Promise<BookmarkWithTags[]> {
    if (!query) return this.getAllBookmarks();
    
    const normalizedQuery = query.toLowerCase();
    const bookmarks = Array.from(this.bookmarks.values())
      .filter(bookmark => 
        bookmark.title.toLowerCase().includes(normalizedQuery) ||
        (bookmark.description?.toLowerCase().includes(normalizedQuery)) ||
        bookmark.url.toLowerCase().includes(normalizedQuery)
      );
    
    return Promise.all(bookmarks.map(bookmark => this.enrichBookmark(bookmark)));
  }
  
  // Folder operations
  async getAllFolders(): Promise<FolderWithCount[]> {
    const folders = Array.from(this.folders.values());
    
    return folders.map(folder => {
      const count = Array.from(this.bookmarks.values())
        .filter(bookmark => bookmark.folderId === folder.id)
        .length;
      
      return { ...folder, count };
    });
  }
  
  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }
  
  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const folder: Folder = { ...insertFolder, id };
    this.folders.set(id, folder);
    return folder;
  }
  
  async updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder | undefined> {
    const existingFolder = this.folders.get(id);
    if (!existingFolder) return undefined;
    
    const updatedFolder = { ...existingFolder, ...folder };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }
  
  async deleteFolder(id: number): Promise<boolean> {
    // Update bookmarks in this folder to have no folder
    for (const [bookmarkId, bookmark] of this.bookmarks.entries()) {
      if (bookmark.folderId === id) {
        const updatedBookmark = { ...bookmark, folderId: null };
        this.bookmarks.set(bookmarkId, updatedBookmark);
      }
    }
    
    return this.folders.delete(id);
  }
  
  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }
  
  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async getTagByName(name: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values())
      .find(tag => tag.name.toLowerCase() === name.toLowerCase());
  }
  
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = this.tagIdCounter++;
    const tag: Tag = { ...insertTag, id };
    this.tags.set(id, tag);
    return tag;
  }
  
  // BookmarkTag operations
  async addTagToBookmark(bookmarkId: number, tagId: number): Promise<void> {
    // Check if association already exists
    const exists = Array.from(this.bookmarkTags.values())
      .some(bt => bt.bookmarkId === bookmarkId && bt.tagId === tagId);
    
    if (!exists) {
      const id = this.bookmarkTagIdCounter++;
      const bookmarkTag: BookmarkTag = { id, bookmarkId, tagId };
      this.bookmarkTags.set(id, bookmarkTag);
    }
  }
  
  async removeTagFromBookmark(bookmarkId: number, tagId: number): Promise<void> {
    const bookmarkTagToDelete = Array.from(this.bookmarkTags.values())
      .find(bt => bt.bookmarkId === bookmarkId && bt.tagId === tagId);
    
    if (bookmarkTagToDelete) {
      this.bookmarkTags.delete(bookmarkTagToDelete.id);
    }
  }
  
  async getTagsForBookmark(bookmarkId: number): Promise<Tag[]> {
    const tagIds = Array.from(this.bookmarkTags.values())
      .filter(bt => bt.bookmarkId === bookmarkId)
      .map(bt => bt.tagId);
    
    return tagIds
      .map(id => this.tags.get(id))
      .filter(tag => tag !== undefined) as Tag[];
  }
  
  async getBookmarksForTag(tagId: number): Promise<Bookmark[]> {
    const bookmarkIds = Array.from(this.bookmarkTags.values())
      .filter(bt => bt.tagId === tagId)
      .map(bt => bt.bookmarkId);
    
    return bookmarkIds
      .map(id => this.bookmarks.get(id))
      .filter(bookmark => bookmark !== undefined) as Bookmark[];
  }
  
  // Helper methods
  private async enrichBookmark(bookmark: Bookmark): Promise<BookmarkWithTags> {
    const tags = await this.getTagsForBookmark(bookmark.id);
    let folder: Folder | undefined;
    
    if (bookmark.folderId) {
      folder = await this.getFolderById(bookmark.folderId);
    }
    
    return { ...bookmark, tags, folder };
  }
}

export const storage = new MemStorage();

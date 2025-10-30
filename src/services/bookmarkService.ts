import { callApi } from '@/utils/actions';

export interface Bookmark {
  bookmark_id: number;
  bookmark_key: string;
  bookmark_note: string;
  session_id: string;
  creation_timestamp: string;
}

export interface BookmarkRequest {
  file_hash: string;
  bookmark_key: string;
  bookmark_note?: string;
  user_id: string;
}

/**
 * Bookmark Service
 * Handles all bookmark-related API operations
 */
export class BookmarkService {
  
  /**
   * Create or update a bookmark
   * @param request - Bookmark data
   * @returns Promise<boolean> - Success status
   */
  static async createBookmark(request: BookmarkRequest): Promise<boolean> {
    try {
      const response = await callApi(
        'bookmark',
        {
          file_hash: request.file_hash,
          bookmark_key: request.bookmark_key,
          bookmark_note: request.bookmark_note || '',
          user_id: request.user_id
        },
        'POST',
        null,
        false
      );
      
      return response !== null;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get all bookmarks for a file
   * @param fileHash - File hash identifier
   * @param userId - User ID for authentication
   * @returns Promise<Bookmark[]> - Array of bookmarks
   */
  static async getBookmarks(fileHash: string, userId: string): Promise<Bookmark[]> {
    try {
      const response = await callApi(
        `bookmarks?file_hash=${encodeURIComponent(fileHash)}`,
        null,
        'GET',
        {
          "X-User-Id": userId
        },
        true
      );
      
      if (response && Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Delete a specific bookmark
   * @param request - Bookmark identification data
   * @returns Promise<boolean> - Success status
   */
  static async deleteBookmark(request: Pick<BookmarkRequest, 'file_hash' | 'bookmark_key' | 'user_id'>): Promise<boolean> {
    try {
      const response = await callApi(
        'bookmark',
        {
          file_hash: request.file_hash,
          bookmark_key: request.bookmark_key,
          user_id: request.user_id
        },
        'DELETE',
        null,
        false
      );
      
      return response !== null;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Toggle bookmark status for a segment
   * @param fileHash - File hash identifier
   * @param segmentStart - Segment start time (bookmark_key)
   * @param isBookmarked - Current bookmark status
   * @param userId - User ID for authentication
   * @returns Promise<boolean> - New bookmark status
   */
  static async toggleBookmark(
    fileHash: string, 
    segmentStart: string, 
    isBookmarked: boolean,
    userId: string
  ): Promise<boolean> {
    if (isBookmarked) {
      // Delete existing bookmark
      const success = await this.deleteBookmark({
        file_hash: fileHash,
        bookmark_key: segmentStart,
        user_id: userId
      });
      return success ? false : isBookmarked; // Return false if deletion succeeded
    } else {
      // Create new bookmark
      const success = await this.createBookmark({
        file_hash: fileHash,
        bookmark_key: segmentStart,
        bookmark_note: '', // No notes as per requirement
        user_id: userId
      });
      return success ? true : isBookmarked; // Return true if creation succeeded
    }
  }

  /**
   * Convert bookmarks array to Set of bookmark keys for easy lookup
   * @param bookmarks - Array of bookmarks
   * @returns Set<string> - Set of bookmark keys
   */
  static bookmarksToSet(bookmarks: Bookmark[]): Set<string> {
    return new Set(bookmarks.map(bookmark => bookmark.bookmark_key));
  }
}


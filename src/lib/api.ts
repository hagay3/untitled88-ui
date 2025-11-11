/**
 * API utilities for Untitled88 frontend
 */

import { getSession } from 'next-auth/react';
import { sendError } from '@/utils/actions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const session = await getSession();
  
  // Return null if no valid session - don't send error reports for missing sessions
  if (!session?.user?.accessToken || !session?.user?.id) {
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.user.accessToken}`,
    'X-User-Id': session.user.id
  };
  
  return headers;
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const headers = await getAuthHeaders();
    
    // Return early if no auth headers (no valid session)
    if (!headers) {
      return null;
    }
    
    const finalHeaders = {
      ...headers,
      ...options.headers,
    };
    
    // Set consistent 5-minute timeout for all endpoints
    const timeoutMs = 5 * 60 * 1000; // 5 minutes
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: finalHeaders,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error message from response
      let errorData;
      try {
        const responseText = await response.text();
        
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
      } catch (readError) {
        errorData = { error: 'Failed to read error response' };
      }

      // Handle specific error cases
      const session = await getSession();
      let errorMsg = '';
      
      if (response.status === 401) {
        errorMsg = 'Authentication failed. Please log in again.';
      } else if (response.status === 403) {
        errorMsg = 'Access denied. You do not have permission to perform this action.';
      } else if (response.status === 429) {
        errorMsg = 'Rate limit exceeded. Please try again later.';
      } else if (response.status >= 500) {
        errorMsg = 'Server error. Please try again later.';
      } else {
        errorMsg = errorData.error || `API request failed: ${response.status} ${response.statusText}`;
      }
      
      await sendError(session?.user?.id || "", errorMsg);
      return null;
    }

    // Try to parse JSON response
    try {
      const responseText = await response.text();
      
      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        return { success: true };
      }
      
      // Try to parse as JSON
      const responseData = JSON.parse(responseText);
      return responseData;
    } catch (parseError) {
      return { success: true }; // Return success for empty responses
    }
  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = `Request timeout after 300 seconds`;
      
      sendError("unknown", `API timeout: ${endpoint} - ${timeoutError}`);
      return null;
    }
    
    const errorDetails = {
      endpoint,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    sendError("unknown", `Failed to call API: ${endpoint} - ${errorDetails.error}`);
    
    return null;
  }
};

// Templates API
export const templatesAPI = {
  getAll: async (params?: { category?: string; is_premium?: boolean; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.is_premium !== undefined) searchParams.append('is_premium', params.is_premium.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/templates${query ? `?${query}` : ''}`);
  },

  getById: async (templateId: number) => {
    return apiRequest(`/templates/${templateId}`);
  },

  getCategories: async () => {
    return apiRequest('/templates/categories');
  },

  search: async (query: string, limit?: number) => {
    const searchParams = new URLSearchParams({ q: query });
    if (limit) searchParams.append('limit', limit.toString());
    return apiRequest(`/templates/search?${searchParams.toString()}`);
  },
};

// Designs API
export const designsAPI = {
  getAll: async (params?: { folder_id?: number; status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.folder_id) searchParams.append('folder_id', params.folder_id.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/designs${query ? `?${query}` : ''}`);
  },

  create: async (designData: any) => {
    return apiRequest('/designs', {
      method: 'POST',
      body: JSON.stringify(designData),
    });
  },

  getById: async (designId: number) => {
    return apiRequest(`/designs/${designId}`);
  },

  update: async (designId: number, designData: any) => {
    return apiRequest(`/designs/${designId}`, {
      method: 'PUT',
      body: JSON.stringify(designData),
    });
  },

  delete: async (designId: number) => {
    return apiRequest(`/designs/${designId}`, {
      method: 'DELETE',
    });
  },

  duplicate: async (designId: number, newName?: string) => {
    return apiRequest(`/designs/${designId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    });
  },

  getStats: async () => {
    return apiRequest('/designs/stats');
  },
};

// AI Conversations API
export const aiAPI = {
  getConversations: async (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/ai/conversations${query ? `?${query}` : ''}`);
  },

  createConversation: async (data?: { design_id?: number; title?: string }) => {
    return apiRequest('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  getMessages: async (conversationId: number, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/ai/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  },

  archiveConversation: async (conversationId: number) => {
    return apiRequest(`/ai/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  },

  getSuggestedPrompts: async (category?: string) => {
    const searchParams = new URLSearchParams();
    if (category) searchParams.append('category', category);
    
    const query = searchParams.toString();
    return apiRequest(`/ai/suggested-prompts${query ? `?${query}` : ''}`);
  },

  getUsageStats: async (days?: number) => {
    const searchParams = new URLSearchParams();
    if (days) searchParams.append('days', days.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/ai/usage-stats${query ? `?${query}` : ''}`);
  },


  quickEmailGeneration: async (data: {
    user_prompt: string;
    email_type?: 'create' | 'update';
    existing_email_html?: string;
  }) => {
    return apiRequest('/ai/quick-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEmailSuggestions: async (category?: string) => {
    const searchParams = new URLSearchParams();
    if (category) searchParams.append('category', category);
    
    const query = searchParams.toString();
    return apiRequest(`/ai/email-suggestions${query ? `?${query}` : ''}`);
  },

  // Rate limit check
  checkRateLimit: async () => {
    return apiRequest('/ai/rate-limit-status');
  },

  getRecentEmails: async (limit: number = 10) => {
    return apiRequest(`/ai/recent-emails?limit=${limit}`);
  },

  getEmailByMessageId: async (messageId: number) => {
    return apiRequest(`/ai/email/${messageId}`);
  },

  getUserUsage: async () => {
    return apiRequest('/ai/user-usage');
  },

  getChatHistory: async (limit: number = 50) => {
    return apiRequest(`/ai/chat-history?limit=${limit}`);
  },
};

// User Actions API
export const userAPI = {
  subscribeUser: async (userId: string) => {
    // Validate user ID before making API call
    if (!userId || userId === 'unknown' || userId === 'unknown_user' || userId.trim() === '') {
      return null;
    }
    
    return apiRequest('/subscribe_user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  logAction: async (actionData: {
    user_id: string;
    action_name: string;
    action_type: string;
    ip_address?: string;
    action_status?: string;
    failure_reason?: string;
  }) => {
    // Validate user ID before making API call
    if (!actionData.user_id || actionData.user_id === 'unknown' || actionData.user_id === 'unknown_user' || actionData.user_id.trim() === '') {
      return null;
    }
    
    return apiRequest('/user_action', {
      method: 'POST',
      body: JSON.stringify(actionData),
    });
  },

  login: async (loginData: {
    user_id: string;
    ip_address?: string;
    browser?: string;
    operating_system?: string;
    operating_system_version?: string;
    device_type?: string;
    device_id?: string;
    device_name?: string;
  }) => {
    // Validate user ID before making API call
    if (!loginData.user_id || loginData.user_id === 'unknown' || loginData.user_id === 'unknown_user' || loginData.user_id.trim() === '') {
      return null;
    }
    
    return apiRequest('/user_login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  },

  logout: async (userId: string) => {
    // Validate user ID before making API call
    if (!userId || userId === 'unknown' || userId === 'unknown_user' || userId.trim() === '') {
      return null;
    }
    
    return apiRequest('/user_logout', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  sendFeedback: async (feedbackData: {
    user_email?: string;
    feedback_text: string;
  }) => {
    return apiRequest('/send_feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },
};

// Folders API
export const foldersAPI = {
  getAll: async (params?: { parent_folder_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.parent_folder_id) searchParams.append('parent_folder_id', params.parent_folder_id.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/folders${query ? `?${query}` : ''}`);
  },

  create: async (folderData: {
    folder_name: string;
    folder_description?: string;
    parent_folder_id?: number;
    folder_color?: string;
    folder_icon?: string;
  }) => {
    return apiRequest('/folders', {
      method: 'POST',
      body: JSON.stringify(folderData),
    });
  },

  getById: async (folderId: number) => {
    return apiRequest(`/folders/${folderId}`);
  },

  update: async (folderId: number, folderData: {
    folder_name?: string;
    folder_description?: string;
    parent_folder_id?: number;
    folder_color?: string;
    folder_icon?: string;
  }) => {
    return apiRequest(`/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(folderData),
    });
  },

  delete: async (folderId: number) => {
    return apiRequest(`/folders/${folderId}`, {
      method: 'DELETE',
    });
  },

  getTree: async () => {
    return apiRequest('/folders/tree');
  },
};

// Exports API
export const exportsAPI = {
  getAll: async (params?: { design_id?: number; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.design_id) searchParams.append('design_id', params.design_id.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/exports${query ? `?${query}` : ''}`);
  },

  create: async (exportData: {
    design_id: number;
    export_type?: string;
    export_format?: string;
  }) => {
    return apiRequest('/exports', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  },

  getById: async (exportId: number) => {
    return apiRequest(`/exports/${exportId}`);
  },

  recordDownload: async (exportId: number) => {
    return apiRequest(`/exports/${exportId}/download`, {
      method: 'POST',
    });
  },

  delete: async (exportId: number) => {
    return apiRequest(`/exports/${exportId}`, {
      method: 'DELETE',
    });
  },

  getStats: async (days?: number) => {
    const searchParams = new URLSearchParams();
    if (days) searchParams.append('days', days.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/exports/stats${query ? `?${query}` : ''}`);
  },
};

// Export utility functions
export const apiUtils = {
  getAuthHeaders,
  apiRequest,
};

// Types for better TypeScript support
export interface Template {
  template_id: number;
  template_name: string;
  template_description: string;
  template_category: string;
  template_type: string;
  template_html: string;
  template_css: string;
  template_preview_image: string;
  template_tags: string[];
  is_premium: boolean;
  usage_count: number;
  creation_timestamp: string;
}

export interface Design {
  design_id: number;
  design_name: string;
  design_description: string;
  template_id?: number;
  design_html: string;
  design_css: string;
  design_json: any;
  design_preview_image: string;
  design_status: string;
  is_favorite: boolean;
  folder_id?: number;
  creation_timestamp: string;
  updated_timestamp: string;
  last_accessed?: string;
  version_number: number;
  parent_design_id?: number;
}

export interface Conversation {
  conversation_id: number;
  design_id?: number;
  session_id: string;
  conversation_title: string;
  conversation_status: string;
  creation_timestamp: string;
  updated_timestamp: string;
  last_message_timestamp?: string;
  message_count: number;
  total_tokens_used: number;
}

export interface Message {
  message_id: number;
  message_type: string;
  message_content: string;
  message_role: string;
  creation_timestamp: string;
  tokens_used: number;
  processing_time_ms?: number;
  message_metadata: any;
}

export interface EmailGenerationResponse {
  success: boolean;
  data?: {
    email_html?: string;
    updated_email_html?: string;
    email_subject: string;
    preheader_text: string;
    design_notes: string;
    mobile_optimized: boolean;
    estimated_size_kb?: string;
    color_palette?: string[];
    fonts_used?: string[];
    key_features?: string[];
    accessibility_features?: string[];
    compatibility_notes?: string;
    changes_made?: string[];
    version_notes?: string;
  };
  conversation_id?: number;
  processing_time_ms?: number;
  message: string;
  error?: string;
  details?: string;
}

export interface EmailSuggestion {
  title: string;
  prompt: string;
  features: string[];
}

export interface EmailSuggestionsResponse {
  success: boolean;
  category?: string;
  suggestions?: {
    description: string;
    examples: EmailSuggestion[];
  };
  all_suggestions?: Record<string, {
    description: string;
    examples: EmailSuggestion[];
  }>;
  categories?: string[];
  total_examples?: number;
  total_categories?: number;
}

export interface RateLimitStatus {
  success: boolean;
  rate_limit_reached: boolean;
  requests_remaining: number;
  reset_time?: string;
  daily_limit: number;
  current_usage: number;
}

export interface Folder {
  folder_id: number;
  folder_name: string;
  folder_description?: string;
  parent_folder_id?: number;
  folder_color: string;
  folder_icon: string;
  creation_timestamp: string;
  updated_timestamp: string;
  design_count: number;
  subfolders?: Folder[];
}

export interface Export {
  export_id: number;
  design_id: number;
  design_name?: string;
  export_type: string;
  export_format: string;
  export_filename: string;
  export_file_path?: string;
  export_file_size?: number;
  export_status: string;
  creation_timestamp: string;
  completed_timestamp?: string;
  download_count: number;
  last_downloaded?: string;
}

export interface FolderTreeResponse {
  success: boolean;
  folder_tree: Folder[];
  total_folders: number;
}

export interface ExportStatsResponse {
  success: boolean;
  stats: {
    total_exports: number;
    completed_exports: number;
    pending_exports: number;
    failed_exports: number;
    total_downloads: number;
    last_export?: string;
    period_days: number;
  };
}


// Update email content in database with JSON structure
export async function updateEmailContent(
  messageId: number,
  emailJson: any, // EmailStructure object
  changeDescription?: string
): Promise<{ success: boolean; message_id?: number; error?: string }> {
  try {
    
    const response = await apiRequest('/emails/update-content', {
      method: 'POST',
      body: JSON.stringify({
        message_id: messageId,
        email_json: emailJson,
        change_description: changeDescription || 'Manual edit'
      })
    });


    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Image Search API
export const imageSearchAPI = {
  /**
   * Search for images using Google Image Search and upload to S3
   * @param searchTerm Search query for images
   * @param limit Maximum number of images (1-10, default 5)
   * @returns Object containing uploaded image URLs
   */
  searchImages: async (searchTerm: string, limit: number = 5) => {
    return apiRequest('/image-search', {
      method: 'POST',
      body: JSON.stringify({
        search_term: searchTerm,
        limit: Math.min(Math.max(1, limit), 10) // Between 1 and 10
      })
    });
  }
};

// Text validation constants
export const TEXT_LIMITS = {
  MAX_PROMPT_LENGTH: 2000,
  MIN_PROMPT_LENGTH: 10,
  WARNING_THRESHOLD: 1800, // Show warning at 90% of limit
} as const;

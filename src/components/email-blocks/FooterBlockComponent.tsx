/**
 * Footer Block Component
 * Handles email footers with company info, social links, and legal links
 */

import React, { useState } from 'react';
import { FooterBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';

interface FooterBlockComponentProps extends BaseEmailBlockProps {
  block: FooterBlock;
}

export const FooterBlockComponent: React.FC<FooterBlockComponentProps> = ({
  block,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Default values for footer fields
  const defaultValues = {
    companyName: block.content.companyName || 'Your Company Name',
    address: block.content.address || '123 Main Street\nCity, State 12345\nCountry',
    unsubscribeText: block.content.unsubscribeText || 'Unsubscribe',
    unsubscribeUrl: block.content.unsubscribeUrl || 'https://example.com/unsubscribe',
    privacyPolicyText: block.content.privacyPolicyText || 'Privacy Policy',
    privacyPolicyUrl: block.content.privacyPolicyUrl || 'https://example.com/privacy'
  };

  // Convert block styles to CSS
  const cssStyles = blockStylesToCss(block.styles);

  const handleFooterEdit = () => {
    setShowEditDialog(true);
  };

  const renderSocialLinks = () => {
    if (!block.content.socialLinks || block.content.socialLinks.length === 0) {
      return null;
    }

    return (
      <div className="flex justify-center space-x-4 mb-4">
        {block.content.socialLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title={link.platform}
          >
            {/* Simple text-based social icons for now */}
            <span className="text-sm font-medium">
              {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
            </span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <EmailBlockWrapper
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div 
        className="relative text-center py-6 px-4 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
        style={cssStyles}
        onClick={() => onSelect?.(block.id)}
      >
        {/* Social Links */}
        {renderSocialLinks()}

        {/* Company Name */}
        {block.content.companyName && (
          <div className="font-semibold mb-2">
            {block.content.companyName}
          </div>
        )}

        {/* Address */}
        {block.content.address && (
          <div className="mb-4 whitespace-pre-line">
            {block.content.address}
          </div>
        )}

        {/* Legal Links */}
        <div className="flex justify-center space-x-4 text-xs">
          {block.content.unsubscribeText && block.content.unsubscribeUrl && (
            <a
              href={block.content.unsubscribeUrl}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {block.content.unsubscribeText}
            </a>
          )}
          
          {block.content.privacyPolicyText && block.content.privacyPolicyUrl && (
            <a
              href={block.content.privacyPolicyUrl}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {block.content.privacyPolicyText}
            </a>
          )}
        </div>

        {/* Inline toolbar for footer editing */}
        {isSelected && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-50">
            <button
              onClick={handleFooterEdit}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Edit footer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {onMoveUp && (
              <button
                onClick={() => onMoveUp(block.id)}
                disabled={!canMoveUp}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {onMoveDown && (
              <button
                onClick={() => onMoveDown(block.id)}
                disabled={!canMoveDown}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(block.id)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Delete block"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        {showEditDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Footer</h3>
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={block.content.companyName || defaultValues.companyName}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          companyName: e.target.value === '' ? '' : e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={block.content.address || defaultValues.address}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          address: e.target.value === '' ? '' : e.target.value
                        }
                      });
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St&#10;City, State 12345&#10;Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unsubscribe Text
                  </label>
                  <input
                    type="text"
                    value={block.content.unsubscribeText || defaultValues.unsubscribeText}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          unsubscribeText: e.target.value === '' ? '' : e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unsubscribe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unsubscribe URL
                  </label>
                  <input
                    type="url"
                    value={block.content.unsubscribeUrl || defaultValues.unsubscribeUrl}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          unsubscribeUrl: e.target.value === '' ? '' : e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/unsubscribe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Privacy Policy Text
                  </label>
                  <input
                    type="text"
                    value={block.content.privacyPolicyText || defaultValues.privacyPolicyText}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          privacyPolicyText: e.target.value === '' ? '' : e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Privacy Policy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Privacy Policy URL
                  </label>
                  <input
                    type="url"
                    value={block.content.privacyPolicyUrl || defaultValues.privacyPolicyUrl}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          privacyPolicyUrl: e.target.value === '' ? '' : e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/privacy"
                  />
                </div>

                {/* Social Links Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Social Links
                  </label>
                  <div className="space-y-2">
                    {(block.content.socialLinks || []).map((link, index) => (
                      <div key={index} className="flex space-x-2">
                        <select
                          value={link.platform}
                          onChange={(e) => {
                            const newSocialLinks = [...(block.content.socialLinks || [])];
                            newSocialLinks[index] = { ...link, platform: e.target.value as 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' };
                            onUpdate?.(block.id, {
                              ...block,
                              content: {
                                ...block.content,
                                socialLinks: newSocialLinks
                              }
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="facebook">Facebook</option>
                          <option value="twitter">Twitter</option>
                          <option value="instagram">Instagram</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="youtube">YouTube</option>
                        </select>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => {
                            const newSocialLinks = [...(block.content.socialLinks || [])];
                            newSocialLinks[index] = { ...link, url: e.target.value };
                            onUpdate?.(block.id, {
                              ...block,
                              content: {
                                ...block.content,
                                socialLinks: newSocialLinks
                              }
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://facebook.com/yourpage"
                        />
                        <button
                          onClick={() => {
                            const newSocialLinks = [...(block.content.socialLinks || [])];
                            newSocialLinks.splice(index, 1);
                            onUpdate?.(block.id, {
                              ...block,
                              content: {
                                ...block.content,
                                socialLinks: newSocialLinks.length > 0 ? newSocialLinks : undefined
                              }
                            });
                          }}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newSocialLinks = [...(block.content.socialLinks || []), { platform: 'facebook' as const, url: '' }];
                        onUpdate?.(block.id, {
                          ...block,
                          content: {
                            ...block.content,
                            socialLinks: newSocialLinks
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600"
                    >
                      + Add Social Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmailBlockWrapper>
  );
};

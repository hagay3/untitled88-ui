/**
 * Template Gallery Component
 * Right-side panel overlay for template selection
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
// import Image from 'next/image';

interface TemplateGalleryProps {
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

interface Template {
  id: string;
  name: string;
  category: string;
  preview: string;
  description: string;
  isPremium: boolean;
  html: string;
  features: string[];
}

export default function TemplateGallery({ onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock templates data
  const templates: Template[] = [
    {
      id: '1',
      name: 'Welcome Series',
      category: 'welcome',
      preview: '/templates/welcome-preview.jpg',
      description: 'Perfect for onboarding new subscribers',
      isPremium: false,
      features: ['Responsive', 'Call-to-Action', 'Social Links'],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to Our Community!</h1>
          <p>We're thrilled to have you join us. Here's what you can expect:</p>
          <ul>
            <li>Weekly newsletters with valuable insights</li>
            <li>Exclusive member-only content</li>
            <li>Early access to new features</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Get Started</a>
          </div>
        </div>
      `
    },
    {
      id: '2',
      name: 'Product Launch',
      category: 'marketing',
      preview: '/templates/product-preview.jpg',
      description: 'Announce new products with style',
      isPremium: true,
      features: ['Hero Image', 'Feature Grid', 'Pricing Table'],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">Introducing Our Latest Product</h1>
            <p style="font-size: 18px; margin: 10px 0 0 0;">Revolutionary features that will change everything</p>
          </div>
          <div style="padding: 30px 20px;">
            <h2>Key Features</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="text-align: center;">
                <h3>Fast</h3>
                <p>Lightning-fast performance</p>
              </div>
              <div style="text-align: center;">
                <h3>Secure</h3>
                <p>Enterprise-grade security</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="#" style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Learn More</a>
            </div>
          </div>
        </div>
      `
    },
    {
      id: '3',
      name: 'Newsletter',
      category: 'newsletter',
      preview: '/templates/newsletter-preview.jpg',
      description: 'Clean and professional newsletter layout',
      isPremium: false,
      features: ['Article Sections', 'Social Media', 'Unsubscribe'],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #3B82F6;">
            <h1 style="margin: 0; color: #333;">Weekly Newsletter</h1>
            <p style="margin: 5px 0 0 0; color: #666;">Your weekly dose of insights</p>
          </header>
          <div style="padding: 30px 20px;">
            <article style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">This Week's Highlights</h2>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
              <a href="#" style="color: #3B82F6; text-decoration: none;">Read more →</a>
            </article>
            <article style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Industry News</h2>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.</p>
              <a href="#" style="color: #3B82F6; text-decoration: none;">Read more →</a>
            </article>
          </div>
        </div>
      `
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'welcome', name: 'Welcome', count: templates.filter(t => t.category === 'welcome').length },
    { id: 'marketing', name: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
    { id: 'newsletter', name: 'Newsletter', count: templates.filter(t => t.category === 'newsletter').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: Template) => {
    const emailData = {
      subject: `${template.name} Email`,
      html: template.html,
      preheader: template.description,
      features: template.features
    };
    onSelectTemplate(emailData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Panel */}
      <div className="w-96 bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Template Gallery</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{category.name}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectTemplate(template)}
              >
                {/* Template Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  {template.isPremium && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                      Premium
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <Button
                      size="sm"
                      className="btn-primary ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template);
                      }}
                    >
                      Use
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {template.features.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{template.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

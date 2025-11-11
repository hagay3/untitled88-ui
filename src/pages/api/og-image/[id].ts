import { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';

interface SharedEmail {
  user_id: string;
  email_address: string;
  email_json: any;
  shareable_link: string;
  email_subject: string;
  email_html: string;
  view_count: number;
  created_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid share ID' });
  }

  try {
    // Fetch the shared email data
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/share/${id}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Untitled88-OG-Generator/1.0'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const sharedEmail: SharedEmail = data.shared_email;

    // Extract email content for the preview
    let emailTitle = sharedEmail.email_subject || 'Shared Email';
    let emailPreview = 'Professional email created with Untitled88';
    let authorEmail = sharedEmail.email_address || 'Anonymous';

    // Try to extract content from email JSON
    try {
      if (sharedEmail.email_json && typeof sharedEmail.email_json === 'object') {
        const blocks = sharedEmail.email_json.blocks || [];
        
        // Find hero or text blocks for preview content
        const contentBlocks = blocks.filter((block: any) => 
          block.blockType === 'hero' || block.blockType === 'text'
        );
        
        if (contentBlocks.length > 0) {
          const firstBlock = contentBlocks[0];
          const content = firstBlock.content;
          const text = content?.headline || content?.text || content?.subheadline || '';
          if (text && text.length > 10) {
            emailPreview = text.length > 120 ? `${text.substring(0, 120)}...` : text;
          }
        }
      }
    } catch (e) {
      // Use default preview
    }

    // Generate Canvas-based Open Graph image
    const width = 1200;
    const height = 630;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, '#faf5ff');
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw email card background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(60, 80, 1080, 470, 20);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw header section
    ctx.fillStyle = '#f9fafb';
    ctx.beginPath();
    ctx.roundRect(60, 80, 1080, 80, [20, 20, 0, 0]);
    ctx.fill();

    // Header border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(1140, 160);
    ctx.stroke();

    // Draw Untitled88 logo circle
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(120, 120, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Untitled88 text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('Untitled88', 160, 130);

    // Draw email subject (title)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial, sans-serif';
    
    // Truncate title if too long
    let displayTitle = emailTitle;
    const maxTitleWidth = 1000;
    let titleWidth = ctx.measureText(displayTitle).width;
    
    while (titleWidth > maxTitleWidth && displayTitle.length > 10) {
      displayTitle = displayTitle.substring(0, displayTitle.length - 4) + '...';
      titleWidth = ctx.measureText(displayTitle).width;
    }
    
    ctx.fillText(displayTitle, 100, 220);

    // Draw email preview content
    ctx.fillStyle = '#4b5563';
    ctx.font = '20px Arial, sans-serif';
    
    // Word wrap for preview text
    const maxPreviewWidth = 1000;
    const lineHeight = 32;
    const words = emailPreview.split(' ');
    let line = '';
    let y = 280;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxPreviewWidth && i > 0) {
        ctx.fillText(line, 100, y);
        line = words[i] + ' ';
        y += lineHeight;
        
        // Limit to 4 lines
        if (y > 380) break;
      } else {
        line = testLine;
      }
    }
    
    if (line && y <= 380) {
      ctx.fillText(line, 100, y);
    }

    // Draw author info
    ctx.fillStyle = '#6b7280';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText(`Shared by ${authorEmail}`, 100, 500);

    // Draw Untitled88 branding footer
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Created with Untitled88 • Professional Email Designer', 100, 540);

    // Draw decorative circles
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.arc(1050, 150, 40, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.beginPath();
    ctx.arc(1100, 200, 25, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.beginPath();
    ctx.arc(150, 500, 30, 0, 2 * Math.PI);
    ctx.fill();

    // Convert canvas to PNG buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Return the PNG image
    res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Fallback to a simple error image using canvas
    try {
      const canvas = createCanvas(1200, 630);
      const ctx = canvas.getContext('2d');
      
      // Simple fallback design
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 1200, 630);
      
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Untitled88 - Email Preview', 600, 315);
      
      const buffer = canvas.toBuffer('image/png');
      res.setHeader('Content-Type', 'image/png');
      res.status(200).send(buffer);
    } catch (fallbackError) {
      // If even the fallback fails, return a simple response
      res.status(500).json({ error: 'Failed to generate preview image' });
    }
  }
}

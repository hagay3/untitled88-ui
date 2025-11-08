const { test, expect } = require('@playwright/test');

test.describe('Untitled88 UI Screenshots', () => {
  
  test('Take screenshots of main pages', async ({ page }) => {
    // Set viewport size for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('🚀 Starting UI screenshot tests...');
    
    try {
      // 1. Homepage
      console.log('📸 Taking screenshot of homepage...');
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'screenshots/01-homepage.png', 
        fullPage: true 
      });
      console.log('✅ Homepage screenshot saved');
      
      // 2. Login page
      console.log('📸 Taking screenshot of login page...');
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'screenshots/02-login.png', 
        fullPage: true 
      });
      console.log('✅ Login page screenshot saved');
      
      // 3. Beta page
      console.log('📸 Taking screenshot of beta page...');
      await page.goto('http://localhost:3000/beta');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'screenshots/03-beta.png', 
        fullPage: true 
      });
      console.log('✅ Beta page screenshot saved');
      
      // 4. Dashboard (if accessible)
      console.log('📸 Attempting to take screenshot of dashboard...');
      try {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ 
          path: 'screenshots/04-dashboard.png', 
          fullPage: true 
        });
        console.log('✅ Dashboard screenshot saved');
      } catch (error) {
        console.log('⚠️ Dashboard might require authentication, skipping...');
      }
      
      // 5. Mobile view of homepage
      console.log('📸 Taking mobile screenshot of homepage...');
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: 'screenshots/05-homepage-mobile.png', 
        fullPage: true 
      });
      console.log('✅ Mobile homepage screenshot saved');
      
    } catch (error) {
      console.error('❌ Error during screenshot capture:', error);
      throw error;
    }
  });
  
  test('Test interactive features', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('🎯 Testing interactive features...');
    
    try {
      // Go to homepage
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot before interaction
      await page.screenshot({ 
        path: 'screenshots/06-before-interaction.png', 
        fullPage: true 
      });
      
      // Try to interact with elements (if they exist)
      const buttons = await page.locator('button').count();
      console.log(`Found ${buttons} buttons on the page`);
      
      if (buttons > 0) {
        // Click first button and take screenshot
        await page.locator('button').first().click();
        await page.waitForTimeout(1000); // Wait for any animations
        await page.screenshot({ 
          path: 'screenshots/07-after-button-click.png', 
          fullPage: true 
        });
        console.log('✅ After button click screenshot saved');
      }
      
      // Check for forms
      const inputs = await page.locator('input').count();
      console.log(`Found ${inputs} input fields on the page`);
      
    } catch (error) {
      console.error('❌ Error during interaction testing:', error);
    }
  });
  
});

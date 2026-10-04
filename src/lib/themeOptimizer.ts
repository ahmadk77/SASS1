/**
 * themeOptimizer.ts
 *
 * Ensures enterprise-grade performance and aesthetic standards for rendered tenant sites.
 * It applies global CSS variables based on the tenant's custom configuration, 
 * injecting glassmorphism, responsive typography, and buttery-smooth layout transitions.
 */

export const applyTenantTheme = (content: any) => {
  if (!content) return;
  
  const root = document.documentElement;
  
  // Base Colors
  if (content.primaryColor) root.style.setProperty('--color-primary', content.primaryColor);
  if (content.secondaryColor) root.style.setProperty('--color-secondary', content.secondaryColor);
  if (content.bgColor) {
    root.style.setProperty('--color-bg', content.bgColor);
    document.body.style.backgroundColor = content.bgColor;
  }
  if (content.textColor) {
    root.style.setProperty('--color-text', content.textColor);
    document.body.style.color = content.textColor;
  }
  
  // Typography
  if (content.fontFamily) {
    root.style.setProperty('--font-family-base', content.fontFamily);
    document.body.style.fontFamily = `"${content.fontFamily}", sans-serif`;
  }
  if (content.baseFontSize) {
    root.style.setProperty('--font-size-base', `${content.baseFontSize}px`);
    document.body.style.fontSize = `${content.baseFontSize}px`;
  }

  // Button Radius Override
  if (content.buttonRadius) {
    let radius = '0px';
    if (content.buttonRadius === 'rounded-md') radius = '0.375rem';
    if (content.buttonRadius === 'rounded-2xl') radius = '1rem';
    if (content.buttonRadius === 'rounded-full') radius = '9999px';
    
    // Inject global style tag to override all buttons
    let styleEl = document.getElementById('tenant-button-radius');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'tenant-button-radius';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      button {
        border-radius: ${radius} !important;
      }
    `;
  }

  // Theme Overrides (Glassmorphism, gradients)
  const isDark = content.bgColor && getBrightness(content.bgColor) < 128;
  root.style.setProperty('--glass-bg', isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)');
  root.style.setProperty('--glass-border', isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');
  
  // Animation settings
  root.style.setProperty('--transition-smooth', 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)');
};

// Helper to determine if a hex color is light or dark
function getBrightness(hex: string) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  // per ITU-R BT.709
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const PremiumAnimations = {
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  },
  staggerContainer: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.1 }
  },
  glassCard: "backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-2xl"
};

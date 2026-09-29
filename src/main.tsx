import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary';
import './index.css';
import { initializeSQLiteSync } from './services/sqliteSync';

// Initialize SQLite real-time database sync for native platforms (standalone APK)
initializeSQLiteSync().catch((err) => {
  console.error('Failed to initialize SQLite sync:', err);
});

// Catch and ignore benign HMR, websocket, and offline/auth network failures
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    const code = event.reason?.code || '';
    if (
      msg.includes('WebSocket') || 
      msg.includes('HMR') ||
      msg.includes('closed without opened') ||
      msg.includes('auth/network-request-failed') ||
      code === 'auth/network-request-failed' ||
      code.includes('auth/')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('auth/network-request-failed') || msg.includes('Firebase: Error (auth/')) {
      event.preventDefault();
    }
  });
}

// --- Global html2canvas compatibility patch for oklch, oklab, and color-mix colors ---
try {
  // Mathematical OKLCH to sRGB conversion
  const oklchToRgb = (l: number, c: number, h: number, alpha?: number): string => {
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);
    const l_lms = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_lms = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_lms = l - 0.0894841775 * a - 1.2914855480 * b;
    const l_lin = Math.pow(Math.max(0, l_lms), 3);
    const m_lin = Math.pow(Math.max(0, m_lms), 3);
    const s_lin = Math.pow(Math.max(0, s_lms), 3);
    const r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
    const g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
    const b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;
    const gamma = (v: number) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    const r = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
    const g = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
    const blueVal = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));
    return alpha !== undefined ? `rgba(${r}, ${g}, ${blueVal}, ${alpha})` : `rgb(${r}, ${g}, ${blueVal})`;
  };

  const oklabToRgb = (l: number, a: number, b: number, alpha?: number): string => {
    const l_lms = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_lms = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_lms = l - 0.0894841775 * a - 1.2914855480 * b;
    const l_lin = Math.pow(Math.max(0, l_lms), 3);
    const m_lin = Math.pow(Math.max(0, m_lms), 3);
    const s_lin = Math.pow(Math.max(0, s_lms), 3);
    const r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
    const g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
    const b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;
    const gamma = (v: number) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    const r = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
    const g = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
    const blueVal = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));
    return alpha !== undefined ? `rgba(${r}, ${g}, ${blueVal}, ${alpha})` : `rgb(${r}, ${g}, ${blueVal})`;
  };

  const sanitizeColor = (val: string): string => {
    if (typeof val !== 'string') return val;
    if (!val.includes('oklch') && !val.includes('oklab') && !val.includes('color-mix')) {
      return val;
    }

    const resolveOklch = (str: string): string => {
      try {
        const match = str.match(/oklch\(\s*([0-9.%]+)\s+([0-9.%]+)\s+([0-9.a-deg%-]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/i);
        if (!match) return 'rgb(79, 70, 229)';
        let l = parseFloat(match[1]);
        if (match[1].endsWith('%')) l /= 100;
        let c = parseFloat(match[2]);
        if (match[2].endsWith('%')) c /= 100;
        let h = parseFloat(match[3]);
        let alpha: number | undefined = undefined;
        if (match[4]) {
          const aStr = match[4].trim();
          alpha = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
        }
        return oklchToRgb(l, c, h, alpha);
      } catch {
        return 'rgb(79, 70, 229)';
      }
    };

    const resolveOklab = (str: string): string => {
      try {
        const match = str.match(/oklab\(\s*([0-9.%]+)\s+([0-9.+-]+)\s+([0-9.+-]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/i);
        if (!match) return 'rgb(79, 70, 229)';
        let l = parseFloat(match[1]);
        if (match[1].endsWith('%')) l /= 100;
        let a = parseFloat(match[2]);
        let b = parseFloat(match[3]);
        let alpha: number | undefined = undefined;
        if (match[4]) {
          const aStr = match[4].trim();
          alpha = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
        }
        return oklabToRgb(l, a, b, alpha);
      } catch {
        return 'rgb(79, 70, 229)';
      }
    };

    let result = val.replace(/oklch\([^)]+\)/gi, (m) => resolveOklch(m));
    result = result.replace(/oklab\([^)]+\)/gi, (m) => resolveOklab(m));

    if (result.includes('color-mix')) {
      result = result.replace(/color-mix\([^)]+\)/gi, 'rgb(79, 70, 229)');
      if (result.includes('color-mix')) {
        return 'rgb(79, 70, 229)';
      }
    }

    return result;
  };

  // 1. Intercept CSSStyleSheet rules to safely filter oklch/oklab entries from html2canvas parsing
  const patchProps = (proto: any) => {
    if (!proto) return;
    const desc = Object.getOwnPropertyDescriptor(proto, 'cssRules');
    if (desc && desc.get) {
      const originalGet = desc.get;
      Object.defineProperty(proto, 'cssRules', {
        get: function() {
          try {
            const rules = originalGet.call(this);
            if (!rules) return rules;
            
            const filtered: any[] = [];
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i];
              if (rule && rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab') || rule.cssText.includes('color-mix'))) {
                continue; // Exclude styles relying on unsupported functions
              }
              filtered.push(rule);
            }

            return new Proxy(rules, {
              get(target, prop) {
                if (prop === 'length') {
                  return filtered.length;
                }
                if (prop === 'item') {
                  return function(index: number) {
                    return filtered[index] || null;
                  };
                }
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                  const idx = parseInt(prop, 10);
                  return filtered[idx];
                }
                const val = Reflect.get(target, prop);
                if (typeof val === 'function') {
                  return val.bind(target);
                }
                return val;
              }
            });
          } catch (e) {
            return [];
          }
        },
        configurable: true,
        enumerable: true
      });
    }
  };

  patchProps(CSSStyleSheet.prototype);
  if (typeof CSSGroupingRule !== 'undefined') patchProps(CSSGroupingRule.prototype);
  if (typeof CSSMediaRule !== 'undefined') patchProps(CSSMediaRule.prototype);
  if (typeof CSSSupportsRule !== 'undefined') patchProps(CSSSupportsRule.prototype);

  // 2. Globally override CSSStyleDeclaration.prototype.getPropertyValue to return safe fallback colors
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  CSSStyleDeclaration.prototype.getPropertyValue = function(this: CSSStyleDeclaration, property: string) {
    const val = originalGetPropertyValue.call(this, property);
    return sanitizeColor(val);
  };

  // 3. Define getters on CSSStyleDeclaration.prototype for common color properties
  const colorProperties = ['backgroundColor', 'color', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
  colorProperties.forEach(prop => {
    const desc = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, prop);
    if (desc && desc.get) {
      const originalGet = desc.get;
      Object.defineProperty(CSSStyleDeclaration.prototype, prop, {
        get: function(this: CSSStyleDeclaration) {
          const val = originalGet.call(this);
          return sanitizeColor(val);
        },
        configurable: true,
        enumerable: true
      });
    }
  });
} catch (err) {
  console.warn('Failed to inject safety compatibility patch for PDF generation:', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);

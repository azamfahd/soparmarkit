import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- Global html2canvas compatibility patch for oklch colors ---
try {
  // 1. Intercept CSSStyleSheet rules to safely filter oklch entries from html2canvas parsing
  // This is applied to CSSStyleSheet, and also CSSGroupingRule/CSSMediaRule if they exist,
  // preventing html2canvas from ever encountering oklch styles inside stylesheets.
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
              if (rule && rule.cssText && rule.cssText.includes('oklch')) {
                continue; // Exclude styles relying on unsupported oklch functions
              }
              filtered.push(rule);
            }

            // Return a Proxy of the original CSSRuleList to preserve instanceof checks
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
    if (typeof val === 'string' && val.includes('oklch')) {
      // Replace with a solid standard indigo color fallback
      return val.replace(/oklch\([^)]+\)/g, 'rgb(79, 70, 229)');
    }
    return val;
  };

  // 3. Wrap window.getComputedStyle to translate rendered oklch values in direct property access (e.g., style.backgroundColor)
  // This uses safe bindings to strictly avoid "Illegal invocation" errors on native DOM objects.
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(elt, pseudoElt) {
    const style = originalGetComputedStyle.call(this, elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        try {
          const val = Reflect.get(target, prop);
          if (typeof val === 'string' && val.includes('oklch')) {
            return val.replace(/oklch\([^)]+\)/g, 'rgb(79, 70, 229)');
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        } catch (e) {
          const directVal = (target as any)[prop];
          if (typeof directVal === 'function') {
            return directVal.bind(target);
          }
          return directVal;
        }
      }
    });
  };
} catch (err) {
  console.warn('Failed to inject oklch safety compatibility patch for PDF generation:', err);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

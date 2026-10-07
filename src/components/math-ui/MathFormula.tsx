import React, { useMemo } from 'react';
import katex from 'katex';

export interface MathFormulaProps {
  math?: string;
  children?: React.ReactNode;
  block?: boolean;
  className?: string;
}

/**
 * Clean standard delimiters from raw LaTeX math strings
 * Handles: $$...$$, $...$, \[...\], \(...\)
 */
export function cleanMathDelimiters(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // Strip block delimiters $$...$$ or \[...\]
  if (str.startsWith('$$') && str.endsWith('$$') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  } else if (str.startsWith('\\[') && str.endsWith('\\]') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  } else if (str.startsWith('$') && str.endsWith('$') && str.length >= 2) {
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('\\(') && str.endsWith('\\)') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  }

  // Normalize common unicode math characters that break KaTeX
  str = str.replace(/[\u2212\u2013\u2014]/g, '-'); // Unicode minus, en-dash, em-dash
  str = str.replace(/\u00D7/g, '\\times ');
  str = str.replace(/\u00F7/g, '\\div ');
  str = str.replace(/\u2248/g, '\\approx ');
  str = str.replace(/\u2260/g, '\\neq ');
  str = str.replace(/\u2264/g, '\\le ');
  str = str.replace(/\u2265/g, '\\ge ');
  str = str.replace(/\u221E/g, '\\infty ');
  str = str.replace(/\u2192/g, '\\to ');

  // Standardize lim to lim\limits so subscript is placed directly underneath
  str = str.replace(/\\lim(?!\s*\\limits)_/g, '\\lim\\limits_');

  return str;
}

/**
 * Universal, rock-solid mathematical formula rendering component using KaTeX.
 * Ensures zero "MathJax error" messages, crisp cross-platform typography,
 * and seamless Light/Dark mode contrast.
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  math,
  children,
  block = false,
  className = '',
}) => {
  const rawContent = math !== undefined ? math : typeof children === 'string' ? children : '';
  const cleanMath = useMemo(() => cleanMathDelimiters(rawContent), [rawContent]);

  const renderedHtml = useMemo(() => {
    if (!cleanMath) return '';
    try {
      return katex.renderToString(cleanMath, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
        strict: false,
        trust: true,
      });
    } catch (err) {
      console.warn('KaTeX rendering fallback for:', cleanMath, err);
      // Clean HTML escaping fallback so it never crashes React
      const escaped = cleanMath
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<span class="text-amber-500 font-mono text-xs">${escaped}</span>`;
    }
  }, [cleanMath, block]);

  if (!renderedHtml) return null;

  if (block) {
    return (
      <div
        className={`overflow-x-auto py-2 my-1.5 text-center font-serif text-slate-900 dark:text-slate-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <span
      className={`inline-block px-0.5 align-baseline font-serif text-slate-900 dark:text-slate-100 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

/**
 * MathText renders text containing mixed plain prose and LaTeX math
 * formatted with $...$ or $$...$$ or \[...\]
 */
export const MathText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Check if line is a standalone block formula: $$...$$ or \[...\]
        const trimmed = line.trim();
        if (
          (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
          (trimmed.startsWith('\\[') && trimmed.endsWith('\\]'))
        ) {
          return <MathFormula key={lineIdx} math={trimmed} block />;
        }

        // Split line by '$' delimiters for inline math
        const parts = line.split('$');
        return (
          <div key={lineIdx} className="break-words">
            {parts.map((part, i) => {
              // Odd indices are math expressions between $...$
              if (i % 2 === 1) {
                if (!part.trim()) return null;
                return (
                  <MathFormula
                    key={i}
                    math={part.trim()}
                    className="text-blue-600 dark:text-cyan-300 font-semibold"
                  />
                );
              }

              // Handle bold **text** in non-math segments
              const boldParts = part.split('**');
              return (
                <span key={i}>
                  {boldParts.map((sub, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} className="font-bold text-slate-900 dark:text-white">
                        {sub}
                      </strong>
                    ) : (
                      sub
                    )
                  )}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Default export for flexibility
export default MathFormula;

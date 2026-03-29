/**
 * Comprehensive SVG sanitization utility
 * Removes potentially dangerous elements and attributes to prevent XSS attacks
 * Uses multiple sanitization passes to catch edge cases
 */

export function sanitizeSvg(svg) {
  if (!svg || typeof svg !== 'string') return ''
  
  let result = svg
  
  // Phase 1: Remove dangerous elements entirely
  // We use multiple patterns to catch edge cases like spaces in closing tags
  
  // Remove script tags - multiple patterns for robustness
  // Pattern 1: Standard <script ...> ... </script>
  result = result.replace(/<script[\s\S]*?<\/script\s*>/gi, '')
  // Pattern 2: Unclosed <script ...> at end of string
  result = result.replace(/<script[\s\S]*$/gi, '')
  // Pattern 3: Malformed closing tags like </script >
  result = result.replace(/<\/script\s*>/gi, '')
  
  // Remove style elements
  result = result.replace(/<style[\s\S]*?<\/style\s*>/gi, '')
  result = result.replace(/<style[\s\S]*$/gi, '')
  result = result.replace(/<\/style\s*>/gi, '')
  
  // Remove object, embed, iframe, frame
  result = result.replace(/<object[\s\S]*?<\/object\s*>/gi, '')
  result = result.replace(/<object[\s\S]*$/gi, '')
  result = result.replace(/<embed[\s\S]*>/gi, '')
  result = result.replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, '')
  result = result.replace(/<iframe[\s\S]*$/gi, '')
  result = result.replace(/<frame[\s\S]*>/gi, '')
  
  // Remove link tags
  result = result.replace(/<link[\s\S]*>/gi, '')
  
  // Remove use elements
  result = result.replace(/<use[\s\S]*>/gi, '')
  
  // Phase 2: Remove HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, '')
  result = result.replace(/<!--[\s\S]*$/g, '')
  
  // Phase 3: Remove event handler attributes (on* attributes)
  result = result.replace(/\s+on\w+\s*=/gi, ' ')
  
  // Phase 4: Remove dangerous href attributes
  result = result.replace(/\shref\s*=\s*["']?\s*(javascript|data|vbscript):[^"'\s]*/gi, ' href=""')
  result = result.replace(/\sxlink:href\s*=\s*["']?\s*(javascript|data|vbscript):[^"'\s]*/gi, ' xlink:href=""')
  
  // Phase 5: Remove dangerous style attributes
  result = result.replace(/\sstyle\s*=\s*["'][^"']*(url|expression|javascript|vbscript|behavior):[^"']*["']/gi, '')
  
  // Phase 6: Remove foreignObject
  result = result.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
  result = result.replace(/<foreignObject[\s\S]*$/gi, '')
  
  // Phase 7: Remove animate and set elements
  result = result.replace(/<animate[\s\S]*>/gi, '')
  result = result.replace(/<set[\s\S]*>/gi, '')
  
  return result
}

/**
 * @deprecated Use sanitizeSvg() instead for comprehensive sanitization
 */
export function stripSvgComments(svg) {
  return sanitizeSvg(svg)
}

/**
 * @deprecated Use sanitizeSvg() instead for comprehensive sanitization
 */
export function stripSvgEventHandlers(svg) {
  return sanitizeSvg(svg)
}

/**
 * @deprecated Use sanitizeSvg() instead for comprehensive sanitization
 */
export function stripDangerousHrefAttributes(svg) {
  return sanitizeSvg(svg)
}

/**
 * @deprecated Use sanitizeSvg() instead for comprehensive sanitization
 */
export function stripDangerousStyleAttributes(svg) {
  return sanitizeSvg(svg)
}

/**
 * @deprecated Use sanitizeSvg() instead for comprehensive sanitization
 */
export function stripDangerousStyleElements(svg) {
  return sanitizeSvg(svg)
}

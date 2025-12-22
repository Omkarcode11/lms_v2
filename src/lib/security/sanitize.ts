/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate and sanitize email addresses
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize MongoDB queries to prevent injection
 */
export function sanitizeMongoQuery(query: unknown): unknown {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  if (Array.isArray(query)) {
    const sanitized: unknown[] = [];
    for (const item of query) {
      sanitized.push(sanitizeMongoQuery(item));
    }
    return sanitized;
  }

  const sanitized: Record<string, unknown> = {};
  const queryObj = query as Record<string, unknown>;

  for (const key in queryObj) {
    // Remove MongoDB operators from user input
    if (key.startsWith('$')) {
      continue;
    }

    const value = queryObj[key];

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate file upload types
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Replace non-alphanumeric characters (except dots and hyphens) with underscores
  let sanitized = filename.replace(/[^a-z0-9.-]/gi, '_');
  
  // Collapse 3+ consecutive underscores to single underscore (preserves double underscores from spaces)
  sanitized = sanitized.replace(/_{3,}/g, '_');
  
  // Collapse leading/trailing multiple underscores to single underscore
  sanitized = sanitized.replace(/^_+/g, '_').replace(/_+$/g, '_');
  
  return sanitized.toLowerCase();
}


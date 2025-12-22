import { sanitizeHtml, isValidEmail, sanitizeMongoQuery, isValidFileType, sanitizeFilename } from '../sanitize';

describe('Sanitize Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeHtml('Hello & World')).toBe('Hello &amp; World');
      expect(sanitizeHtml("It's a test")).toBe('It&#x27;s a test');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle normal text without special characters', () => {
      expect(sanitizeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeMongoQuery', () => {
    it('should remove MongoDB operators from query', () => {
      const query = {
        name: 'test',
        $where: 'malicious',
        age: { $gt: 10 },
      };
      const sanitized = sanitizeMongoQuery(query) as Record<string, unknown>;
      expect(sanitized.$where).toBeUndefined();
      expect(sanitized.name).toBe('test');
    });

    it('should handle nested objects', () => {
      const query = {
        user: {
          name: 'test',
          $ne: 'malicious',
        },
      };
      const sanitized = sanitizeMongoQuery(query) as Record<string, unknown>;
      const user = sanitized.user as Record<string, unknown>;
      expect(user.$ne).toBeUndefined();
      expect(user.name).toBe('test');
    });

    it('should handle arrays', () => {
      const query = ['test', { $where: 'malicious' }];
      const sanitized = sanitizeMongoQuery(query) as unknown[];
      expect(sanitized[0]).toBe('test');
      const second = sanitized[1] as Record<string, unknown>;
      expect(second.$where).toBeUndefined();
    });

    it('should return primitive values as-is', () => {
      expect(sanitizeMongoQuery('string')).toBe('string');
      expect(sanitizeMongoQuery(123)).toBe(123);
      expect(sanitizeMongoQuery(null)).toBe(null);
    });
  });

  describe('isValidFileType', () => {
    it('should validate allowed file types', () => {
      expect(isValidFileType('document.pdf', ['pdf', 'doc', 'docx'])).toBe(true);
      expect(isValidFileType('image.PNG', ['png', 'jpg', 'jpeg'])).toBe(true);
      expect(isValidFileType('video.mp4', ['mp4', 'avi', 'mov'])).toBe(true);
    });

    it('should reject disallowed file types', () => {
      expect(isValidFileType('script.exe', ['pdf', 'doc'])).toBe(false);
      expect(isValidFileType('file.txt', ['pdf', 'doc'])).toBe(false);
      expect(isValidFileType('noextension', ['pdf'])).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames with special characters', () => {
      expect(sanitizeFilename('My File (2024).pdf')).toBe('my_file_2024_.pdf');
      expect(sanitizeFilename('Test@File#123.txt')).toBe('test_file_123.txt');
      expect(sanitizeFilename('  spaced  file  .pdf')).toBe('_spaced__file__.pdf');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('UPPERCASE.pdf')).toBe('uppercase.pdf');
    });

    it('should replace multiple underscores with single', () => {
      expect(sanitizeFilename('file___name.pdf')).toBe('file_name.pdf');
    });
  });
});


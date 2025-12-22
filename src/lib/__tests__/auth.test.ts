import bcrypt from 'bcryptjs';

describe('Auth Utilities', () => {
  describe('bcrypt password hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });
});


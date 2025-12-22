import mongoose from 'mongoose';
import connectDB from '../connection';

// Mock mongoose
const mockConnect = jest.fn();
jest.mock('mongoose', () => ({
  connect: mockConnect,
}));

describe('MongoDB Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the global cache
    (global as any).mongooseCache = undefined;
    mockConnect.mockClear();
  });

  afterEach(() => {
    (global as any).mongooseCache = undefined;
  });

  it('should connect to MongoDB successfully', async () => {
    mockConnect.mockResolvedValueOnce(mongoose);

    await connectDB();

    expect(mockConnect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 5,
      })
    );
  });

  it('should reuse existing connection', async () => {
    mockConnect.mockResolvedValue(mongoose);

    // First call
    await connectDB();
    // Second call should reuse
    await connectDB();

    // Should only connect once
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should handle connection errors', async () => {
    const mockError = new Error('Connection failed');
    mockConnect.mockRejectedValueOnce(mockError);
    // Reset cache for error test
    (global as any).mongooseCache = undefined;

    await expect(connectDB()).rejects.toThrow('Connection failed');
  });
});


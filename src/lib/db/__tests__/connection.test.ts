import mongoose from 'mongoose';
import connectDB from '../connection';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('MongoDB Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mongooseCache = undefined;
  });

  it('should connect to MongoDB successfully', async () => {
    const mockConnect = jest.fn().mockResolvedValue(mongoose);
    (mongoose.connect as jest.Mock) = mockConnect;

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
    const mockConnect = jest.fn().mockResolvedValue(mongoose);
    (mongoose.connect as jest.Mock) = mockConnect;

    await connectDB();
    await connectDB();

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should handle connection errors', async () => {
    const mockError = new Error('Connection failed');
    (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

    await expect(connectDB()).rejects.toThrow('Connection failed');
  });
});


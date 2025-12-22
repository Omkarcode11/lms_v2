import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  certificateUrl?: string;
  issuedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    certificateUrl: {
      type: String,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString() as unknown as string;
        delete (ret as unknown as { _id?: mongoose.Types.ObjectId })._id;
        delete (ret as unknown as { __v?: number }).__v;
        return ret;
      },
    },
  }
);

// Indexes
CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CertificateSchema.index({ userId: 1 });
CertificateSchema.index({ courseId: 1 });

const Certificate: Model<ICertificate> = mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);

export default Certificate;


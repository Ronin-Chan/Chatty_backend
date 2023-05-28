import { IFollowDocument } from '@follow/interfaces/follow.interface';
import mongoose, { model, Model, Schema } from 'mongoose';

const followSchema: Schema = new Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  followeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  createdAt: { type: Date, default: Date.now() }
});

const FollowModel: Model<IFollowDocument> = model<IFollowDocument>('Follow', followSchema, 'Follow');
export { FollowModel };

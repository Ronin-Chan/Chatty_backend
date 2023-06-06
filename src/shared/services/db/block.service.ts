import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';
import { PushOperator } from 'mongodb';

class BlockService {
  public async updateBlockInDB(userId: string, blockedUserId: string): Promise<void> {
    UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(userId), blocked: { $ne: new mongoose.Types.ObjectId(blockedUserId) } },
          update: {
            $push: {
              blocked: new mongoose.Types.ObjectId(blockedUserId)
            } as PushOperator<Document>
          }
        }
      },
      {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(blockedUserId), blockedBy: { $ne: new mongoose.Types.ObjectId(userId) } },
          update: {
            $push: {
              blockedBy: new mongoose.Types.ObjectId(userId)
            } as PushOperator<Document>
          }
        }
      }
    ]);
  }

  public async updateUnBlockInDB(userId: string, blockedUserId: string): Promise<void> {
    UserModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(userId) },
          update: {
            $pull: {
              blocked: new mongoose.Types.ObjectId(blockedUserId)
            } as PushOperator<Document>
          }
        }
      },
      {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(blockedUserId) },
          update: {
            $pull: {
              blockedBy: new mongoose.Types.ObjectId(userId)
            } as PushOperator<Document>
          }
        }
      }
    ]);
  }
}

export const blockService: BlockService = new BlockService();

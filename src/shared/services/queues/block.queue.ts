import { IBlockJobData } from '@root/features/block/interfaces/block.interface';
import { BaseQueue } from '@service/queues/base.queue';
import { blockWorker } from '@worker/block.worker';

class BlockQueue extends BaseQueue{
    constructor(){
      super('block');
      this.processJob('updateBlockInDB', 5, blockWorker.updateBlockOrUnblockInDB );
      this.processJob('updateUnblockInDB', 5, blockWorker.updateBlockOrUnblockInDB );
    }

    public addBlockJob(name: string, data: IBlockJobData): void {
      this.addJob(name, data);
    }
}

export const blockQueue: BlockQueue = new BlockQueue();

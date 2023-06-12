import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { joiValidation } from '@global/decorators/joiValidation.decorators';
import { BadRequestError } from '@global/helpers/errorHandler';
import { authService } from '@service/db/auth.service';
import { userService } from '@service/db/user.service';
import { resetPasswordTemplate } from '@service/emails/templates/reset-password/reset-password-template';
import { emailQueue } from '@service/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { changePasswordSchema } from '@user/schemes/info.scheme';
import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import moment from 'moment';
import publicIP from 'ip';

export class ChangePwd {
  @joiValidation(changePasswordSchema)
  public async changePwd(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { currentPassword, confirmPassword, newPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return next(new BadRequestError('Passwords do not match.'));
    }
    const currentUser: IAuthDocument = await authService.getAuthUserByUsername(`${req.currentUser?.username}`);
    const passwordMatch: boolean = await currentUser.comparePassword(currentPassword);
    if (!passwordMatch) {
      return next(new BadRequestError('Invalid credentials'));
    }
    const hashedNewPwd: string = await currentUser.hashPassword(newPassword);
    await userService.updatePwd(`${req.currentUser?.username}`, hashedNewPwd);

    const templateParams: IResetPasswordParams = {
      username: currentUser.username!,
      email: currentUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };
    const template: string = resetPasswordTemplate.useResetPasswordTemplate(templateParams);
    emailQueue.addEmailJob('changePassword', { template, receiverEmail: currentUser.email!, subject: 'Password update confirmation' });
    res.status(HTTP_STATUS.OK).json({
      message: 'Password updated successfully. You will be redirected shortly to the login page.'
    });
  }
}

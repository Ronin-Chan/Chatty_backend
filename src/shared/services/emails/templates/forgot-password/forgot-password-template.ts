import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate {
  public useForgotPasswordTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(__dirname + '/forgot-password-template.ejs', 'utf8'), {
      username, //properties used in the template
      resetLink,
      image_url: 'https://img.wxcha.com/m00/cf/e5/2fa674804a43b403f12a1024cdbef184.jpg'
    });
  }
}

export const forgotPasswordTemplate: ForgotPasswordTemplate = new ForgotPasswordTemplate();

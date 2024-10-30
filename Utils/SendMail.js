import { createTransport } from 'nodemailer'
const sendEmail = (option) => {
  const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  const emailOptions = {
    from: `sunaina ralia<sunainaralia@gmail.com>`,
    to: option.email,
    subject: option.subject,
    text: option.message
  };
  transporter.sendMail(emailOptions);
}

export default sendEmail;
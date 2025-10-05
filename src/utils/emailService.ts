import nodemailer from "nodemailer";
import nodemailerSendgrid from "nodemailer-sendgrid";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export const sendEmail = async (mailOptions: MailOptions): Promise<void> => {
  const fromEmail = mailOptions.from || (process.env.EMAIL_USER as string);

  const emailData = {
    from: fromEmail,
    to: mailOptions.to,
    subject: mailOptions.subject,
    html: mailOptions.html,
    replyTo: mailOptions.replyTo || fromEmail,
  };

  try {
    // Primary Email Service (SendGrid)
    const sendgridTransporter = nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.SENDGRID_API_KEY as string,
      })
    );
    await sendgridTransporter.sendMail(emailData);
  } catch (sendgridError) {
    // SendGrid failed, falling back to Gmail

    try {
      // Fallback Email Service (Nodemailer/Gmail)
      const fallbackTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await fallbackTransporter.sendMail(emailData);
    } catch (fallbackError) {
      // Both email services failed
      throw new Error("Failed to send email through all available services");
    }
  }
};

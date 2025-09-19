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
    console.log(`Email sent successfully via SendGrid to ${mailOptions.to}`);
  } catch (sendgridError) {
    console.error("SendGrid failed, falling back to Gmail:", sendgridError);

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
      console.log(
        `Email sent successfully via Gmail fallback to ${mailOptions.to}`
      );
    } catch (fallbackError) {
      console.error("Both email services failed:", fallbackError);
      throw new Error("Failed to send email through all available services");
    }
  }
};

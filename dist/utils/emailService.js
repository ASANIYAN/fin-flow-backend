"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const nodemailer_sendgrid_1 = __importDefault(require("nodemailer-sendgrid"));
const sendEmail = async (mailOptions) => {
    const fromEmail = mailOptions.from || process.env.EMAIL_USER;
    const emailData = {
        from: fromEmail,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        replyTo: mailOptions.replyTo || fromEmail,
    };
    try {
        // Primary Email Service (SendGrid)
        const sendgridTransporter = nodemailer_1.default.createTransport((0, nodemailer_sendgrid_1.default)({
            apiKey: process.env.SENDGRID_API_KEY,
        }));
        await sendgridTransporter.sendMail(emailData);
    }
    catch (sendgridError) {
        // SendGrid failed, falling back to Gmail
        try {
            // Fallback Email Service (Nodemailer/Gmail)
            const fallbackTransporter = nodemailer_1.default.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            await fallbackTransporter.sendMail(emailData);
        }
        catch (fallbackError) {
            // Both email services failed
            throw new Error("Failed to send email through all available services");
        }
    }
};
exports.sendEmail = sendEmail;

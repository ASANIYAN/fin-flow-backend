"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const nodemailer_sendgrid_1 = __importDefault(require("nodemailer-sendgrid"));
const sendEmail = (mailOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield sendgridTransporter.sendMail(emailData);
        console.log(`Email sent successfully via SendGrid to ${mailOptions.to}`);
    }
    catch (sendgridError) {
        console.error("SendGrid failed, falling back to Gmail:", sendgridError);
        try {
            // Fallback Email Service (Nodemailer/Gmail)
            const fallbackTransporter = nodemailer_1.default.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            yield fallbackTransporter.sendMail(emailData);
            console.log(`Email sent successfully via Gmail fallback to ${mailOptions.to}`);
        }
        catch (fallbackError) {
            console.error("Both email services failed:", fallbackError);
            throw new Error("Failed to send email through all available services");
        }
    }
});
exports.sendEmail = sendEmail;

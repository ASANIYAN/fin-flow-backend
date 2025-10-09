"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.verifyEmail = exports.signup = exports.sendVerificationEmail = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Import Prisma for error handling - use the main client types since they're the same
const message_1 = require("../utils/message");
const emailService_1 = require("../utils/emailService");
const userService_1 = require("../services/userService");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
const sendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, message_1.errorResponse)(res, 400, "Email is required");
        }
        const user = await (0, userService_1.findUserByEmail)(email);
        if (!user) {
            return (0, message_1.errorResponse)(res, 404, "User not found");
        }
        if (user.isEmailVerified) {
            return (0, message_1.errorResponse)(res, 400, "Email is already verified");
        }
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verificationToken}`;
        const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const htmlContent = `
<!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="format-detection"
      content="telephone=no, date=no, address=no, email=no"
    />
    <!--[if mso]>
      <xml
        ><o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings
        ></xml
      >
      <style>
        td,
        th,
        div,
        p,
        a,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: "Segoe UI", sans-serif;
          mso-line-height-rule: exactly;
        }
      </style>
    <![endif]-->
    <title>Confirm Your Email Address</title>
    <style>
      /* Your base CSS styles */
      .hover-underline:hover {
        text-decoration: underline !important;
      }

      @media (max-width: 600px) {
        .sm-w-full {
          width: 100% !important;
        }
        .sm-px-24 {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .sm-py-32 {
          padding-top: 32px !important;
          padding-bottom: 32px !important;
        }
      }
    </style>
  </head>
  <body
    style="
      margin: 0;
      width: 100%;
      padding: 0;
      word-break: break-word;
      -webkit-font-smoothing: antialiased;
      background-color: #f0f4f9;
    "
  >
    <div style="display: none">Please confirm your email address</div>
    <div
      role="article"
      aria-roledescription="email"
      aria-label="Confirm Your Email Address"
      lang="en"
    >
      <table
        style="
          width: 100%;
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        "
        cellpadding="0"
        cellspacing="0"
        role="presentation"
      >
        <tr>
          <td
            align="center"
            style="
              background-color: #4d31ee;
              padding-top: 24px;
              padding-bottom: 24px;
            "
          >
            <!-- Logo (Placeholder) -->
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <span
                    style="
                      font-size: 24px;
                      font-weight: 700;
                      color: #ffffff;
                      text-decoration: none;
                    "
                  >P2P Platform</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center">
            <table
              class="sm-w-full"
              style="width: 600px"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tr>
                <td
                  class="sm-py-32 sm-px-24"
                  style="
                    padding: 48px;
                    text-align: left;
                    background-color: #ffffff;
                    border-radius: 4px;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  "
                >
                  <p
                    style="
                      margin: 0;
                      font-size: 16px;
                      color: #1a1a1a;
                      font-weight: 600;
                    "
                  >
                    Hi ${user.email},
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Thank you for joining our P2P lending platform! We're excited for you to start borrowing and lending with confidence.
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Your account was successfully created on: ${currentDate}
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    For security reasons, it is imperative that you confirm your
                    email address. To get started, confirm your email address by
                    clicking the button below.
                  </p>

                  <!-- Button -->
                  <table cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 16px 0">
                        <a
                          href="${verificationUrl}"
                          style="
                            display: inline-block;
                            border-radius: 6px;
                            background-color: #4d31ee;
                            padding: 10px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            color: #ffffff;
                            text-decoration: none;
                          "
                        >
                          Confirm your email &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    If the button above does not work, please copy and paste the following URL into your web browser:
                    <br><a href="${verificationUrl}" class="hover-underline" style="color: #4d31ee; text-decoration: underline; word-break: break-all;">${verificationUrl}</a>
                  </p>

                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Best regards,<br />The P2P Lending Team
                  </p>

                  <table
                    style="width: 100%"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                  >
                    <tr>
                      <td style="padding-top: 24px; padding-bottom: 24px">
                        <div
                          style="
                            height: 1px;
                            background-color: #e5e7eb;
                            line-height: 1px;
                          "
                        >
                          &zwnj;
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; font-size: 16px; color: #1a1a1a">
                    If you have any questions or need assistance, kindly contact
                    us at:
                    <a
                      href="mailto:support@p2papp.com"
                      class="hover-underline"
                      style="color: #4d31ee; text-decoration: none"
                      >support@p2papp.com</a
                    >
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td
                  style="
                    padding: 32px 24px;
                    text-align: center;
                    font-size: 16px;
                    color: #1a1a1a;
                  "
                >
                  <p style="margin: 0 0 8px">
                    Cheers to smart, community-driven finance!
                  </p>
                  <p style="margin: 0; font-style: italic">
                    &copy; ${new Date().getFullYear()} P2P Lending Platform. All rights reserved.
                  </p>
                  <!-- Social Icons (Removed due to path dependencies, add back with full URLs if needed) -->
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;
        await (0, emailService_1.sendEmail)({
            to: user.email,
            subject: "Verify Your Email Address",
            html: htmlContent,
        });
        return (0, message_1.successResponse)(res, 200, "Verification email sent successfully");
    }
    catch (error) {
        // Unexpected error in sendVerificationEmail
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const signup = async (req, res) => {
    const { email, password, confirmPassword, firstName, lastName } = req.body;
    // Define validation schema for signup
    const signupValidationSchema = {
        email: {
            type: "string",
            required: true,
            minLength: 5,
            maxLength: 255,
        },
        password: {
            type: "string",
            required: true,
            minLength: 8,
            maxLength: 128,
        },
        confirmPassword: {
            type: "string",
            required: true,
            minLength: 8,
            maxLength: 128,
        },
        firstName: {
            type: "string",
            required: true,
            minLength: 1,
            maxLength: 50,
        },
        lastName: {
            type: "string",
            required: true,
            minLength: 1,
            maxLength: 50,
        },
    };
    // Validate request data
    if (!(0, validation_1.validateAndRespond)(req.body, signupValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    // Additional validation for password confirmation
    if (password !== confirmPassword) {
        return (0, message_1.errorResponse)(res, 400, "Passwords do not match", {
            code: "VALIDATION_ERROR",
            fields: [
                {
                    field: "confirmPassword",
                    message: "Password confirmation does not match the password",
                    expectedType: "string",
                    receivedType: "string",
                },
            ],
        });
    }
    try {
        const newUser = await (0, userService_1.createUser)(email, password, firstName, lastName);
        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newUser.verificationToken}`;
        const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const htmlContent = `
<!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="format-detection"
      content="telephone=no, date=no, address=no, email=no"
    />
    <!--[if mso]>
      <xml
        ><o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings
        ></xml
      >
      <style>
        td,
        th,
        div,
        p,
        a,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: "Segoe UI", sans-serif;
          mso-line-height-rule: exactly;
        }
      </style>
    <![endif]-->
    <title>Confirm Your Email Address</title>
    <style>
      /* Your base CSS styles */
      .hover-underline:hover {
        text-decoration: underline !important;
      }

      @media (max-width: 600px) {
        .sm-w-full {
          width: 100% !important;
        }
        .sm-px-24 {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .sm-py-32 {
          padding-top: 32px !important;
          padding-bottom: 32px !important;
        }
      }
    </style>
  </head>
  <body
    style="
      margin: 0;
      width: 100%;
      padding: 0;
      word-break: break-word;
      -webkit-font-smoothing: antialiased;
      background-color: #f0f4f9;
    "
  >
    <div style="display: none">Please confirm your email address</div>
    <div
      role="article"
      aria-roledescription="email"
      aria-label="Confirm Your Email Address"
      lang="en"
    >
      <table
        style="
          width: 100%;
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        "
        cellpadding="0"
        cellspacing="0"
        role="presentation"
      >
        <tr>
          <td
            align="center"
            style="
              background-color: #4d31ee;
              padding-top: 24px;
              padding-bottom: 24px;
            "
          >
            <!-- Logo (Placeholder) -->
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <span
                    style="
                      font-size: 24px;
                      font-weight: 700;
                      color: #ffffff;
                      text-decoration: none;
                    "
                  >P2P Platform</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center">
            <table
              class="sm-w-full"
              style="width: 600px"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tr>
                <td
                  class="sm-py-32 sm-px-24"
                  style="
                    padding: 48px;
                    text-align: left;
                    background-color: #ffffff;
                    border-radius: 4px;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  "
                >
                  <p
                    style="
                      margin: 0;
                      font-size: 16px;
                      color: #1a1a1a;
                      font-weight: 600;
                    "
                  >
                    Hi ${email},
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Thank you for joining our P2P lending platform! We're excited for you to start borrowing and lending with confidence.
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Your account was successfully created on: ${currentDate}
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    For security reasons, it is imperative that you confirm your
                    email address. To get started, confirm your email address by
                    clicking the button below.
                  </p>

                  <!-- Button -->
                  <table cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 16px 0">
                        <a
                          href="${verificationUrl}"
                          style="
                            display: inline-block;
                            border-radius: 6px;
                            background-color: #4d31ee;
                            padding: 10px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            color: #ffffff;
                            text-decoration: none;
                          "
                        >
                          Confirm your email &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    If the button above does not work, please copy and paste the following URL into your web browser:
                    <br><a href="${verificationUrl}" class="hover-underline" style="color: #4d31ee; text-decoration: underline; word-break: break-all;">${verificationUrl}</a>
                  </p>

                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Best regards,<br />The P2P Lending Team
                  </p>

                  <table
                    style="width: 100%"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                  >
                    <tr>
                      <td style="padding-top: 24px; padding-bottom: 24px">
                        <div
                          style="
                            height: 1px;
                            background-color: #e5e7eb;
                            line-height: 1px;
                          "
                        >
                          &zwnj;
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; font-size: 16px; color: #1a1a1a">
                    If you have any questions or need assistance, kindly contact
                    us at:
                    <a
                      href="mailto:support@p2papp.com"
                      class="hover-underline"
                      style="color: #4d31ee; text-decoration: none"
                      >support@p2papp.com</a
                    >
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td
                  style="
                    padding: 32px 24px;
                    text-align: center;
                    font-size: 16px;
                    color: #1a1a1a;
                  "
                >
                  <p style="margin: 0 0 8px">
                    Cheers to smart, community-driven finance!
                  </p>
                  <p style="margin: 0; font-style: italic">
                    &copy; ${new Date().getFullYear()} P2P Lending Platform. All rights reserved.
                  </p>
                  <!-- Social Icons (Removed due to path dependencies, add back with full URLs if needed) -->
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;
        await (0, emailService_1.sendEmail)({
            to: newUser.email,
            subject: "Verify Your Email Address",
            html: htmlContent,
        });
        const userData = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isEmailVerified: newUser.isEmailVerified,
        };
        return (0, message_1.successResponse)(res, 201, "User created successfully", userData);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            return (0, message_1.errorResponse)(res, 409, "Email already in use");
        }
        // Unexpected error during signup
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
};
exports.signup = signup;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await (0, userService_1.findUserByVerificationToken)(token);
        if (!user) {
            return (0, message_1.errorResponse)(res, 400, "Invalid or expired verification token.");
        }
        await (0, userService_1.verifyUser)(user.id);
        // Return success response for frontend to handle redirection
        return (0, message_1.successResponse)(res, 200, "Email verified successfully");
    }
    catch (error) {
        // Unexpected error during verifyEmail
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    // Define validation schema for login
    const loginValidationSchema = {
        email: {
            type: "string",
            required: true,
            minLength: 5,
            maxLength: 255,
        },
        password: {
            type: "string",
            required: true,
            minLength: 1,
        },
    };
    // Validate request data
    if (!(0, validation_1.validateAndRespond)(req.body, loginValidationSchema, res)) {
        return; // Response already sent by validateAndRespond
    }
    const { email, password } = req.body;
    try {
        const user = await (0, userService_1.findUserByEmail)(email);
        if (!user) {
            return (0, message_1.errorResponse)(res, 401, "Invalid email or password");
        }
        const isMatch = await (0, userService_1.comparePasswords)(password, user.password);
        if (!isMatch) {
            return (0, message_1.errorResponse)(res, 401, "Invalid email or password");
        }
        // Check if email is verified
        if (!user.isEmailVerified) {
            return (0, message_1.errorResponse)(res, 403, "Please verify your email address before logging in");
        }
        // Generate JWT with 24 hour expiry
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" } // Token expires in 24 hours
        );
        // Decode token to extract issued at and expiry
        const decoded = jsonwebtoken_1.default.decode(token);
        const tokenData = decoded || {};
        // Compute expireAt from token 'exp' claim if present, otherwise fallback to 24h from now
        const expireAt = tokenData.exp
            ? new Date(tokenData.exp * 1000).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
        };
        return (0, message_1.successResponse)(res, 200, "Login successful", {
            token: {
                value: token,
                expiresAt: expireAt,
            },
            user: userData,
        });
    }
    catch (error) {
        // Unexpected error during login
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
};
exports.login = login;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, message_1.errorResponse)(res, 400, "Email is required");
        }
        const resetToken = await (0, userService_1.generatePasswordResetToken)(email);
        if (!resetToken) {
            return (0, message_1.successResponse)(res, 200, "If a user with that email exists, a password reset link has been sent.");
        }
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
        const currentDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const htmlContent = `
<!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="format-detection"
      content="telephone=no, date=no, address=no, email=no"
    />
    <!--[if mso]>
      <xml
        ><o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings
        ></xml
      >
      <style>
        td,
        th,
        div,
        p,
        a,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: "Segoe UI", sans-serif;
          mso-line-height-rule: exactly;
        }
      </style>
    <![endif]-->
    <title>Password Reset Request</title>
    <style>
      /* Your base CSS styles */
      .hover-underline:hover {
        text-decoration: underline !important;
      }

      @media (max-width: 600px) {
        .sm-w-full {
          width: 100% !important;
        }
        .sm-px-24 {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
        .sm-py-32 {
          padding-top: 32px !important;
          padding-bottom: 32px !important;
        }
      }
    </style>
  </head>
  <body
    style="
      margin: 0;
      width: 100%;
      padding: 0;
      word-break: break-word;
      -webkit-font-smoothing: antialiased;
      background-color: #f0f4f9;
    "
  >
    <div style="display: none">Password Reset for Your Account</div>
    <div
      role="article"
      aria-roledescription="email"
      aria-label="Password Reset Request"
      lang="en"
    >
      <table
        style="
          width: 100%;
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        "
        cellpadding="0"
        cellspacing="0"
        role="presentation"
      >
        <tr>
          <td
            align="center"
            style="
              background-color: #4d31ee;
              padding-top: 24px;
              padding-bottom: 24px;
            "
          >
            <!-- Logo (Placeholder) -->
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <span
                    style="
                      font-size: 24px;
                      font-weight: 700;
                      color: #ffffff;
                      text-decoration: none;
                    "
                  >P2P Platform</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center">
            <table
              class="sm-w-full"
              style="width: 600px"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tr>
                <td
                  class="sm-py-32 sm-px-24"
                  style="
                    padding: 48px;
                    text-align: left;
                    background-color: #ffffff;
                    border-radius: 4px;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  "
                >
                  <p
                    style="
                      margin: 0;
                      font-size: 16px;
                      color: #1a1a1a;
                      font-weight: 600;
                    "
                  >
                    Hello,
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    We received a request to reset the password for the account associated with **${email}** on ${currentDate}.
                  </p>
                  
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    To proceed with resetting your password, please click the button below. **This link is valid for 1 hour** for your security.
                  </p>

                  <!-- Button -->
                  <table cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 16px 0">
                        <a
                          href="${resetUrl}"
                          style="
                            display: inline-block;
                            border-radius: 6px;
                            background-color: #4d31ee;
                            padding: 10px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            color: #ffffff;
                            text-decoration: none;
                          "
                        >
                          Reset My Password &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                      font-weight: 700; /* Added emphasis */
                    "
                  >
                    If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
                  </p>
                  <p
                    style="
                      margin: 16px 0;
                      font-size: 16px;
                      line-height: 24px;
                      color: #1a1a1a;
                    "
                  >
                    Best regards,<br />The P2P Lending Team
                  </p>

                  <table
                    style="width: 100%"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                  >
                    <tr>
                      <td style="padding-top: 24px; padding-bottom: 24px">
                        <div
                          style="
                            height: 1px;
                            background-color: #e5e7eb;
                            line-height: 1px;
                          "
                        >
                          &zwnj;
                        </div>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; font-size: 16px; color: #1a1a1a">
                    If you have any questions or need assistance, kindly contact
                    us at:
                    <a
                      href="mailto:support@p2papp.com"
                      class="hover-underline"
                      style="color: #4d31ee; text-decoration: none"
                      >support@p2papp.com</a
                    >
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td
                  style="
                    padding: 32px 24px;
                    text-align: center;
                    font-size: 16px;
                    color: #1a1a1a;
                  "
                >
                  <p style="margin: 0 0 8px">
                    Security is our top priority.
                  </p>
                  <p style="margin: 0; font-style: italic">
                    &copy; ${new Date().getFullYear()} P2P Lending Platform. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;
        await (0, emailService_1.sendEmail)({
            to: email,
            subject: "Password Reset Request for Your Account",
            html: htmlContent,
        });
        return (0, message_1.successResponse)(res, 200, "If a user with that email exists, a password reset link has been sent.");
    }
    catch (error) {
        // Unexpected error during forgotPassword
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return (0, message_1.errorResponse)(res, 400, "Token and password are required");
        }
        const updatedUser = await (0, userService_1.resetUserPassword)(token, newPassword);
        if (!updatedUser) {
            return (0, message_1.errorResponse)(res, 400, "Invalid or expired password reset token.");
        }
        return (0, message_1.successResponse)(res, 200, "Password reset successful.");
    }
    catch (error) {
        // Unexpected error during resetPassword
        return (0, message_1.errorResponse)(res, 500, "An unexpected error occurred", error);
    }
};
exports.resetPassword = resetPassword;

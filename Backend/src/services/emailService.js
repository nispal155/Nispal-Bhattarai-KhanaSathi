const nodemailer = require('nodemailer');
require('dotenv').config();


console.log('Email Config:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD,
});

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
    debug: true,
    logger: true,
});

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"KhanaSathi" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - KhanaSathi',
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 60px 20px;">
                <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
                  
                  <!-- Logo/Brand -->
                  <tr>
                    <td style="padding-bottom: 40px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                        KhanaSathi
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        Your verification code is:
                      </p>
                      
                      <!-- OTP -->
                      <div style="margin: 32px 0; padding: 24px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 600; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </div>
                      </div>
                      
                      <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        This code expires in 10 minutes.
                      </p>
                      
                      <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding-top: 48px; border-top: 1px solid #e5e7eb; margin-top: 48px;">
                      <p style="margin: 0; font-size: 12px; line-height: 16px; color: #9ca3af;">
                        © ${new Date().getFullYear()} KhanaSathi. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
        };

        // Log OTP to console for development
        console.log('\n=== OTP GENERATED ===');
        console.log('Email:', email);
        console.log('OTP:', otp);
        console.log('=====================\n');

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return { success: false, error: error.message };
    }
};

// Send Password Reset OTP email
const sendPasswordResetOTP = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"KhanaSathi" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Password - KhanaSathi',
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 60px 20px;">
                <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
                  
                  <!-- Logo/Brand -->
                  <tr>
                    <td style="padding-bottom: 40px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                        KhanaSathi
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        We received a request to reset your password. Use the code below to proceed:
                      </p>
                      
                      <!-- OTP -->
                      <div style="margin: 32px 0; padding: 24px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 600; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </div>
                      </div>
                      
                      <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        This code expires in 10 minutes.
                      </p>
                      
                      <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding-top: 48px; border-top: 1px solid #e5e7eb; margin-top: 48px;">
                      <p style="margin: 0; font-size: 12px; line-height: 16px; color: #9ca3af;">
                        © ${new Date().getFullYear()} KhanaSathi. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
        };

        // Log OTP to console for development
        console.log('\n=== PASSWORD RESET OTP ===');
        console.log('Email:', email);
        console.log('OTP:', otp);
        console.log('==========================\n');

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset OTP email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset OTP email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { generateOTP, sendOTP, sendPasswordResetOTP };

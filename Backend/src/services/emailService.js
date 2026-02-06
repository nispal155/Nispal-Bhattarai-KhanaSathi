const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// The "from" address — use your verified domain, or Resend's test sender
const FROM_EMAIL = process.env.EMAIL_FROM || 'KhanaSathi <onboarding@resend.dev>';

console.log('Email Config: Resend API (HTTPS), from:', FROM_EMAIL);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTP = async (email, otp) => {
  try {
    // Log OTP to console for development
    console.log('\n=== OTP GENERATED ===');
    console.log('Email:', email);
    console.log('OTP:', otp);
    console.log('=====================\n');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
                  <tr>
                    <td style="padding-bottom: 40px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                        KhanaSathi
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        Your verification code is:
                      </p>
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
    });

    if (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }

    console.log('OTP email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset OTP email
const sendPasswordResetOTP = async (email, otp) => {
  try {
    console.log('\n=== PASSWORD RESET OTP ===');
    console.log('Email:', email);
    console.log('OTP:', otp);
    console.log('==========================\n');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
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
                  <tr>
                    <td style="padding-bottom: 40px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                        KhanaSathi
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        We received a request to reset your password. Use the code below to proceed:
                      </p>
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
    });

    if (error) {
      console.error('Error sending password reset OTP email:', error);
      return { success: false, error: error.message };
    }

    console.log('Password reset OTP email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Welcome Email with Login Details
const sendWelcomeEmail = async (email, username, password, role, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to KhanaSathi Team - Your Login Details',
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
                  <tr>
                    <td style="padding-bottom: 40px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                        KhanaSathi
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        Hi <strong>${username}</strong>,
                      </p>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        Welcome to the KhanaSathi team! Your account has been created as a <strong>${role}</strong>.
                      </p>
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #000000;">
                        Here are your login credentials:
                      </p>
                      <div style="margin: 32px 0; padding: 24px; background-color: #f8f9fa; border-radius: 8px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Email:</p>
                        <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #000000;">${email}</p>
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Password:</p>
                        <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #000000;">${password}</p>
                        <div style="margin-top: 20px; border-top: 1px dashed #d1d5db; padding-top: 20px;">
                            <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">Verification OTP:</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ea580c; letter-spacing: 5px;">${otp}</p>
                            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">Use this OTP to verify your account on first login.</p>
                        </div>
                      </div>
                      <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                        Please login immediately and change your password for security purposes.
                      </p>
                    </td>
                  </tr>
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
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { generateOTP, sendOTP, sendPasswordResetOTP, sendWelcomeEmail };

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  services: string[];
  message: string;
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to sanitize input
function sanitize(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Generate HTML email template
function generateEmailHTML(data: ContactFormData): string {
  const { firstName, lastName, email, phone, services, message } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          border-bottom: 3px solid #2dd4bf;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #000000;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }
        .field {
          margin-bottom: 20px;
        }
        .field-label {
          font-weight: 600;
          color: #2dd4bf;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .field-value {
          color: #333;
          font-size: 16px;
          word-wrap: break-word;
        }
        .services-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .service-tag {
          background-color: #e0f7f5;
          color: #0b4d5a;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        .message-box {
          background-color: #f9f9f9;
          border-left: 4px solid #2dd4bf;
          padding: 15px;
          margin-top: 8px;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
          <p>From russabuss.com</p>
        </div>

        <div class="field">
          <div class="field-label">Name</div>
          <div class="field-value">${sanitize(firstName)} ${sanitize(lastName)}</div>
        </div>

        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">
            <a href="mailto:${email}" style="color: #2dd4bf; text-decoration: none;">
              ${email}
            </a>
          </div>
        </div>

        ${phone ? `
        <div class="field">
          <div class="field-label">Phone</div>
          <div class="field-value">
            <a href="tel:${phone}" style="color: #2dd4bf; text-decoration: none;">
              ${sanitize(phone)}
            </a>
          </div>
        </div>
        ` : ''}

        ${services.length > 0 ? `
        <div class="field">
          <div class="field-label">Services Interested In</div>
          <div class="services-list">
            ${services.map(service => `<span class="service-tag">${sanitize(service)}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        <div class="field">
          <div class="field-label">Message</div>
          <div class="message-box">
            ${sanitize(message).replace(/\n/g, '<br>')}
          </div>
        </div>

        <div class="footer">
          This message was sent via the contact form on russabuss.com
        </div>
      </div>
    </body>
    </html>
  `;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let data: ContactFormData;

    try {
      data = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid request format'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Server-side validation
    const errors: string[] = [];

    if (!data.firstName || !data.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!data.lastName || !data.lastName.trim()) {
      errors.push('Last name is required');
    }

    if (!data.email || !data.email.trim()) {
      errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
      errors.push('Invalid email address');
    }

    if (!data.message || !data.message.trim()) {
      errors.push('Message is required');
    }

    // Check if services is an array
    if (data.services && !Array.isArray(data.services)) {
      errors.push('Invalid services format');
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation failed',
          errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for Resend API key
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // In development or if API key is not set, log to console and return success
      console.log('RESEND_API_KEY not set. Contact form submission (dev mode):');
      console.log(JSON.stringify(data, null, 2));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message received (development mode)',
          dev_mode: true
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send email using Resend
    try {
      const resend = new Resend(apiKey);

      const emailResult = await resend.emails.send({
        from: 'noreply@russabuss.com',
        to: 'audio@russabuss.com',
        subject: `New inquiry from ${data.firstName} ${data.lastName}`,
        html: generateEmailHTML(data),
        replyTo: data.email
      });

      if (emailResult.error) {
        console.error('Resend API error:', emailResult.error);

        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to send email. Please try again or contact us directly.'
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message sent successfully',
          id: emailResult.data?.id
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (emailError) {
      console.error('Error sending email:', emailError);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to send email. Please try again later.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

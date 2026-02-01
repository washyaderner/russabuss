# Beat Store Infrastructure Setup

> This document outlines how to set up the full e-commerce infrastructure for selling beats with Stripe payments and secure file delivery. Implement this when you're ready to go live with sales.

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Contentful    │     │     Stripe      │     │  Cloudflare R2  │
│                 │     │                 │     │                 │
│  Beat metadata  │     │    Payments     │     │  Downloadable   │
│  Preview MP3s   │     │    Webhooks     │     │  ZIP files      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Your Astro Site     │
                    │                         │
                    │  - Beat Player (React)  │
                    │  - Checkout API route   │
                    │  - Webhook handler      │
                    │  - Resend for emails    │
                    └─────────────────────────┘
```

---

## Part 1: Contentful Setup

### Create "Beat" Content Type

In Contentful, create a new content type called `beat` with these fields:

| Field Name | Field Type | Required | Notes |
|------------|------------|----------|-------|
| `title` | Short text | Yes | Beat name (e.g., "Dark Trap Vibes") |
| `slug` | Short text | Yes | URL-friendly ID (e.g., "dark-trap-vibes") |
| `bpm` | Integer | Yes | Tempo (e.g., 140) |
| `key` | Short text | Yes | Musical key (e.g., "F# Minor") |
| `genre` | Short text | Yes | Genre tag (e.g., "Trap", "R&B", "Drill") |
| `previewMp3` | Media | Yes | 30-60 second preview MP3 for the player |
| `coverArt` | Media | No | Optional per-beat cover (falls back to logo) |
| `tags` | Short text, list | No | Additional tags for filtering |
| `featured` | Boolean | No | Show in featured section |
| `active` | Boolean | Yes | Whether beat is available for sale |
| `createdDate` | Date | Yes | For sorting by newest |

### Contentful API Integration

Your existing `/src/lib/contentful.ts` can be extended:

```typescript
// Add to /src/lib/contentful.ts

export interface Beat {
  title: string;
  slug: string;
  bpm: number;
  key: string;
  genre: string;
  previewMp3: {
    fields: {
      file: {
        url: string;
      };
    };
  };
  coverArt?: {
    fields: {
      file: {
        url: string;
      };
    };
  };
  tags?: string[];
  featured?: boolean;
  active: boolean;
  createdDate: string;
}

export async function getBeats(): Promise<Beat[]> {
  if (!client) return [];

  try {
    const entries = await client.getEntries({
      content_type: 'beat',
      'fields.active': true,
      order: ['-fields.createdDate'],
    });

    return entries.items.map((item: any) => item.fields as Beat);
  } catch (error) {
    console.error('Error fetching beats:', error);
    return [];
  }
}

export async function getBeatBySlug(slug: string): Promise<Beat | null> {
  if (!client) return null;

  try {
    const entries = await client.getEntries({
      content_type: 'beat',
      'fields.slug': slug,
      limit: 1,
    });

    return entries.items[0]?.fields as Beat || null;
  } catch (error) {
    console.error('Error fetching beat:', error);
    return null;
  }
}
```

---

## Part 2: Cloudflare R2 Setup

### Create R2 Bucket

1. Log into Cloudflare dashboard
2. Go to R2 Object Storage
3. Create bucket named `russabuss-beats`
4. Note your Account ID

### Generate API Credentials

1. Go to R2 > Manage R2 API Tokens
2. Create token with Object Read & Write permissions
3. Save these values:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME` = `russabuss-beats`

### File Naming Convention

Upload ZIP files with this naming pattern:
```
{beat-slug}-{license}.zip

Examples:
dark-trap-vibes-mp3.zip      (contains: beat.mp3, license.pdf)
dark-trap-vibes-wav.zip      (contains: beat.mp3, beat.wav, license.pdf)
dark-trap-vibes-stems.zip    (contains: beat.mp3, beat.wav, stems/, license.pdf)
dark-trap-vibes-exclusive.zip (contains: everything + exclusive license.pdf)
```

### R2 Integration Code

Create `/src/lib/r2.ts`:

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateDownloadUrl(
  beatSlug: string,
  licenseType: 'mp3' | 'wav' | 'stems' | 'exclusive'
): Promise<string> {
  const key = `${beatSlug}-${licenseType}.zip`;

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  // URL expires in 48 hours
  const url = await getSignedUrl(S3, command, { expiresIn: 172800 });

  return url;
}
```

### Add to .env

```env
# Cloudflare R2 (add when ready)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=russabuss-beats
```

---

## Part 3: Stripe Setup

### Create Products in Stripe Dashboard

Create one product per license type:

| Product Name | Price ID (example) | Price |
|--------------|-------------------|-------|
| Beat License - MP3 | `price_mp3_xxxxx` | $50 |
| Beat License - WAV | `price_wav_xxxxx` | $80 |
| Beat License - STEMS | `price_stems_xxxxx` | $249 |
| Beat License - EXCLUSIVE | `price_exclusive_xxxxx` | $2,000 |

Or use dynamic pricing with metadata.

### Checkout Session API

Create `/src/pages/api/checkout.ts`:

```typescript
import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const LICENSE_PRICES: Record<string, number> = {
  mp3: 5000,        // $50.00 in cents
  wav: 8000,        // $80.00
  stems: 24900,     // $249.00
  exclusive: 200000, // $2,000.00
};

const LICENSE_NAMES: Record<string, string> = {
  mp3: 'MP3 License (320kbps)',
  wav: 'WAV License (24-bit 48kHz)',
  stems: 'STEMS License (Track Outs)',
  exclusive: 'Exclusive License (Full Rights)',
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { beatSlug, beatTitle, licenseType } = await request.json();

    if (!beatSlug || !beatTitle || !licenseType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      });
    }

    const price = LICENSE_PRICES[licenseType];
    const licenseName = LICENSE_NAMES[licenseType];

    if (!price) {
      return new Response(JSON.stringify({ error: 'Invalid license type' }), {
        status: 400,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${beatTitle} - ${licenseName}`,
              description: `License for "${beatTitle}"`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        beatSlug,
        beatTitle,
        licenseType,
      },
      success_url: `${process.env.SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/beats`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Checkout failed' }), {
      status: 500,
    });
  }
};
```

### Stripe Webhook Handler

Create `/src/pages/api/webhook.ts`:

```typescript
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { generateDownloadUrl } from '../../lib/r2';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const { beatSlug, beatTitle, licenseType } = session.metadata || {};
    const customerEmail = session.customer_details?.email;

    if (!beatSlug || !licenseType || !customerEmail) {
      console.error('Missing metadata in session');
      return new Response('Missing metadata', { status: 400 });
    }

    try {
      // Generate secure download URL (expires in 48 hours)
      const downloadUrl = await generateDownloadUrl(
        beatSlug,
        licenseType as 'mp3' | 'wav' | 'stems' | 'exclusive'
      );

      // Send delivery email
      await resend.emails.send({
        from: 'Russabuss <noreply@russabuss.com>',
        to: customerEmail,
        subject: `Your Beat Download: ${beatTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { color: #2dd4bf; font-size: 24px; font-weight: bold; }
              .content { background: #111; border: 1px solid #222; border-radius: 12px; padding: 30px; }
              .button { display: inline-block; background: #2dd4bf; color: #000; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { color: #f59e0b; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">RUSSABUSS</div>
              </div>
              <div class="content">
                <h1>Thanks for your purchase!</h1>
                <p>Your download for <strong>${beatTitle}</strong> is ready.</p>
                <p><strong>License:</strong> ${licenseType.toUpperCase()}</p>
                <a href="${downloadUrl}" class="button">Download Your Files</a>
                <p class="warning">This link expires in 48 hours. Download your files and save them securely.</p>
              </div>
              <div class="footer">
                <p>Questions? Reply to this email or contact us at hello@russabuss.com</p>
                <p>&copy; ${new Date().getFullYear()} Russabuss. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`Delivery email sent to ${customerEmail} for ${beatTitle}`);
    } catch (error) {
      console.error('Error processing purchase:', error);
      return new Response('Delivery failed', { status: 500 });
    }
  }

  return new Response('OK', { status: 200 });
};
```

### Add Stripe Keys to .env

```env
# Stripe (add your keys)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Set Up Webhook in Stripe Dashboard

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://russabuss.com/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret to `.env`

---

## Part 4: Dependencies to Install

When ready to implement:

```bash
npm install stripe @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Part 5: Testing Checklist

Before going live:

- [ ] Create test beat in Contentful
- [ ] Upload test ZIP files to R2
- [ ] Test checkout flow with Stripe test mode
- [ ] Verify webhook receives events
- [ ] Confirm download link works and expires correctly
- [ ] Test email delivery via Resend
- [ ] Switch Stripe to live mode
- [ ] Update webhook URL for production

---

## File Structure After Implementation

```
/src
├── /components
│   └── /BeatPlayer
│       ├── BeatPlayer.jsx
│       ├── Waveform.jsx
│       ├── TrackList.jsx
│       ├── LicensePopover.jsx
│       └── AddToCart.jsx
├── /lib
│   ├── contentful.ts    (extended with beat queries)
│   └── r2.ts            (new - R2 signed URLs)
├── /pages
│   ├── /api
│   │   ├── checkout.ts  (new - Stripe checkout)
│   │   ├── webhook.ts   (new - Stripe webhook)
│   │   └── contact.ts   (existing)
│   ├── /checkout
│   │   └── success.astro (new - thank you page)
│   └── beats.astro      (new - beats page with player)
```

---

## Cost Summary (When Live)

| Service | Cost |
|---------|------|
| Contentful | Free (under 25K assets) |
| Cloudflare R2 | Free (under 10GB storage) |
| Stripe | 2.9% + $0.30 per transaction |
| Resend | Free (under 3K emails/month) |

**Total fixed cost: $0/month** - you only pay Stripe's percentage when you make sales.

---

## Quick Start When Ready

1. Set up Cloudflare R2 bucket
2. Add environment variables
3. Create "Beat" content type in Contentful
4. Install dependencies: `npm install stripe @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
5. Create the API routes above
6. Connect Stripe webhook
7. Upload your first beat + ZIP files
8. Test in Stripe test mode
9. Go live!

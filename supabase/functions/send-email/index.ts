// Fix: Add Deno types reference to resolve "Cannot find name 'Deno'" error.
/// <reference types="https://deno.land/x/deno/types/index.d.ts" />

// IMPORTANT: This file should be placed in your project at `supabase/functions/send-email/index.ts`
// You also need to configure an `import_map.json` file in your `supabase` directory to include nodemailer.
// Example `supabase/import_map.json`:
// {
//   "imports": {
//     "nodemailer": "npm:nodemailer@6.9.14"
//   }
// }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import nodemailer from 'nodemailer';

// FIX: Added 'Access-Control-Allow-Methods' to properly handle CORS preflight requests.
// This is a common cause for "Failed to fetch" errors from the browser.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Send-email function initialized.');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();
    console.log(`Received request to send email to: ${to}`);

    // Create a Nodemailer transporter using Gmail
    // IMPORTANT: Credentials are read from Supabase environment variables (secrets).
    // Set these in your Supabase project dashboard: `supabase secrets set GMAIL_USER=... GMAIL_APP_PASSWORD=...`
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailAppPassword) {
      console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.');
      throw new Error('Email service is not configured correctly on the server.');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: gmailUser,
        pass: gmailAppPassword, 
      },
    });

    const mailOptions = {
      from: `"Oratora AI" <${gmailUser}>`,
      to: to,
      subject: subject,
      html: html,
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', info.messageId);

    return new Response(JSON.stringify({ message: 'Email sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

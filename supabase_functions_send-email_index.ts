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
    // IMPORTANT: The provided credentials are used here. 'pass' should be a Gmail App Password.
    // In a production environment, these should be stored as encrypted Supabase secrets.
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'abdulrahmanadebambo@gmail.com',
        pass: 'ujjf lwbo mvxc soct', 
      },
    });

    const mailOptions = {
      from: '"Oratora AI" <abdulrahmanadebambo@gmail.com>',
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

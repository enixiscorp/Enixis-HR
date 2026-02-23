import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Enixis HR <onboarding@resend.dev>'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Check API key configured
    if (!RESEND_API_KEY) {
      console.error('[send-welcome-email] ERROR: RESEND_API_KEY is not set in Edge Function secrets!')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured', code: 'missing_api_key' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { email, password, firstName, lastName, loginUrl } = body

    if (!email || !firstName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, firstName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-welcome-email] Sending welcome email to: ${email}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Bienvenue sur HERIX - Vos accès',
        html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: auto; background: #0f172a; color: #f1f5f9; border-radius: 16px; overflow: hidden;">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 40px 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: white; letter-spacing: -0.5px;">HERIX</h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">Plateforme de Gestion RH</p>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 40px 32px;">
                        <h2 style="margin: 0 0 8px 0; font-size: 22px; color: #f1f5f9;">Bienvenue, ${firstName} ! 👋</h2>
                        <p style="color: #94a3b8; margin-bottom: 28px;">Votre compte a été créé avec succès. Voici vos informations de connexion :</p>
                        
                        <!-- Credentials Box -->
                        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                            <p style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">Vos identifiants</p>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div>
                                    <span style="color: #64748b; font-size: 12px;">Email</span>
                                    <p style="margin: 2px 0 0 0; color: #06b6d4; font-family: monospace; font-size: 15px;">${email}</p>
                                </div>
                                <div style="border-top: 1px solid #334155; padding-top: 10px;">
                                    <span style="color: #64748b; font-size: 12px;">Mot de passe</span>
                                    <p style="margin: 2px 0 0 0; color: #f1f5f9; font-family: monospace; font-size: 15px; background: #0f172a; padding: 6px 10px; border-radius: 6px; display: inline-block;">${password}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center;">
                            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px;">
                                Accéder à ma plateforme →
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 24px 32px; border-top: 1px solid #1e293b; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #475569;">Pour votre sécurité, changez votre mot de passe dès la première connexion.</p>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #334155;">© 2026 HERIX - Enixis Corp</p>
                    </div>
                </div>
                `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[send-welcome-email] Resend API error:', JSON.stringify(data))
      return new Response(
        JSON.stringify({ error: 'Resend API error', details: data }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-welcome-email] Email sent successfully. ID: ${data.id}`)
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[send-welcome-email] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

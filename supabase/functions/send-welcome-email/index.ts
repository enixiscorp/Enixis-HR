import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
    const { email, password, firstName, lastName, loginUrl } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'Enixis HR <onboarding@resend.dev>', // Change to your verified domain later
            to: [email],
            subject: 'Bienvenue sur Enixis HR - Vos accès',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #06b6d4;">Bienvenue, ${firstName} !</h2>
          <p>Votre compte collaborateur a été créé avec succès par votre organisation.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Identifiant :</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Mot de passe :</strong> ${password}</p>
          </div>

          <p>Vous pouvez vous connecter dès maintenant pour accéder à votre tableau de bord :</p>
          
          <a href="${loginUrl}" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
            Accéder à la plateforme
          </a>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #6b7280; font-style: italic;">
            Remarque : Pour votre sécurité, nous vous recommandons de changer votre mot de passe dès votre première connexion.
          </p>
        </div>
      `,
        }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    })
})

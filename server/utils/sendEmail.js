const nodemailer = require('nodemailer');

/**
 * Crée le transporteur email
 * Supporte Gmail, Mailtrap, ou tout SMTP
 */
const createTransporter = () => {
  // Gmail SMTP
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // SMTP générique (Mailtrap, etc.)
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Envoie un email
 */
const sendEmail = async (to, subject, html) => {
  try {
    console.log(`📧 Envoi email à: ${to} | Sujet: ${subject}`);

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Sénégal Vote" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès ! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    // Ne pas bloquer le processus si l'email échoue
    return { success: false, error: error.message };
  }
};

/**
 * Template email OTP
 */
const emailOTPTemplate = (prenom, code, type) => {
  const titre = type === 'authentification' 
    ? 'Code de vérification - Sénégal Vote' 
    : 'Confirmation de votre vote - Sénégal Vote';
  
  const message = type === 'authentification'
    ? `Votre code de vérification pour accéder à la plateforme de vote`
    : `Votre code de confirmation pour valider votre vote`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #007B3A 0%, #00A651 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🇸🇳 Sénégal Vote</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">${titre}</p>
      </div>
      <div style="padding: 30px; background: white;">
        <p>Bonjour <strong>${prenom}</strong>,</p>
        <p>${message} :</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #007B3A; color: white; font-size: 32px; letter-spacing: 8px; padding: 15px 30px; display: inline-block; border-radius: 8px; font-weight: bold;">
            ${code}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">⏱ Ce code expire dans <strong>5 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">⚠️ Ne partagez jamais ce code avec quiconque.</p>
      </div>
      <div style="background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2026 Sénégal Vote - Plateforme de Vote Électronique</p>
      </div>
    </div>
  `;
};

/**
 * Template email de confirmation de vote
 */
const emailVoteConfirmationTemplate = (prenom, dateVote, hashVote) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #007B3A 0%, #00A651 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🇸🇳 Sénégal Vote</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Confirmation de vote</p>
      </div>
      <div style="padding: 30px; background: white;">
        <p>Bonjour <strong>${prenom}</strong>,</p>
        <p>Votre vote a été <strong style="color: #007B3A;">enregistré avec succès</strong> !</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666;">📅 Date du vote : <strong>${dateVote}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #666;">🔐 Référence : <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${hashVote}</code></p>
        </div>

        <p style="color: #666; font-size: 14px;">✅ Votre vote est confidentiel et sécurisé.</p>
        <p style="color: #666; font-size: 14px;">Merci pour votre participation civique !</p>
      </div>
      <div style="background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2026 Sénégal Vote - Plateforme de Vote Électronique</p>
      </div>
    </div>
  `;
};

module.exports = { sendEmail, emailOTPTemplate, emailVoteConfirmationTemplate };

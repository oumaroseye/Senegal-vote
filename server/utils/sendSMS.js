/**
 * Envoi de SMS - Simulation avec log serveur
 * Le canal principal pour l'OTP est l'EMAIL (Gmail)
 * Le SMS est un canal secondaire optionnel
 */
const sendSMS = async (telephone, message) => {
  try {
    // Formater le numéro au format international Sénégal (+221)
    let formattedPhone = telephone;
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('221')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+221' + formattedPhone;
      }
    }

    console.log('='.repeat(50));
    console.log('📱 SMS OTP');
    console.log(`   Destinataire: ${formattedPhone}`);
    console.log(`   Message: ${message}`);
    console.log('='.repeat(50));

    return { success: true, message: 'SMS logged' };
  } catch (error) {
    console.error('❌ Erreur SMS:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Template SMS OTP
 */
const smsOTPTemplate = (code, type) => {
  if (type === 'authentification') {
    return `[Sénégal Vote] Votre code de vérification est: ${code}. Valide 5 min. Ne partagez pas ce code.`;
  }
  return `[Sénégal Vote] Code de confirmation de vote: ${code}. Valide 5 min. Ne partagez pas ce code.`;
};

module.exports = { sendSMS, smsOTPTemplate };

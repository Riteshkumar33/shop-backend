// Twilio Verify Service for OTP
// In development mode, uses a mock that accepts "123456" as valid code

const isMock = process.env.TWILIO_ACCOUNT_SID === 'mock' || !process.env.TWILIO_ACCOUNT_SID;

let twilioClient;
if (!isMock) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const formatPhone = (phone) => {
  // If phone already has a country code (starts with '+'), return as is
  // Otherwise, prepend standard Indian country code '+91'
  return phone.startsWith('+') ? phone : `+91${phone}`;
};

const sendOTP = async (phone) => {
  const formattedPhone = formatPhone(phone);

  if (isMock) {
    console.log(`[MOCK OTP] Sending OTP to ${formattedPhone}. Use code: 123456`);
    return { status: 'pending', to: formattedPhone };
  }

  const verification = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SID)
    .verifications.create({ to: formattedPhone, channel: 'sms' });

  return { status: verification.status, to: formattedPhone };
};

const verifyOTP = async (phone, code) => {
  const formattedPhone = formatPhone(phone);

  if (isMock) {
    const approved = code === '123456';
    console.log(`[MOCK OTP] Verifying ${formattedPhone} with code ${code}: ${approved ? 'approved' : 'denied'}`);
    return { status: approved ? 'approved' : 'denied', to: formattedPhone };
  }

  const verificationCheck = await twilioClient.verify.v2
    .services(process.env.TWILIO_VERIFY_SID)
    .verificationChecks.create({ to: formattedPhone, code });

  return { status: verificationCheck.status, to: formattedPhone };
};

module.exports = { sendOTP, verifyOTP };

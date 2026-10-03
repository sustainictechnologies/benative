export const whatsappConfig = {
  verifyToken:         process.env.WHATSAPP_VERIFY_TOKEN         ?? '',
  accessToken:         process.env.WHATSAPP_ACCESS_TOKEN         ?? '',
  phoneNumberId:       process.env.WHATSAPP_PHONE_NUMBER_ID      ?? '',
  businessAccountId:   process.env.WHATSAPP_BUSINESS_ACCOUNT_ID  ?? '',
} as const

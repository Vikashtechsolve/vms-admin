const CHANNEL_LABELS = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
}

export function formatChannelLabel(channelId) {
  return CHANNEL_LABELS[channelId] || channelId
}

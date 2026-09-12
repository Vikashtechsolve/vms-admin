import { formatChannelLabel } from '../utils/channels.js'

export default function ChannelPill({ channel, className = '' }) {
  const label = formatChannelLabel(channel)
  return (
    <span className={`comm-channel-pill comm-channel-pill--${channel} ${className}`.trim()}>
      {label}
    </span>
  )
}

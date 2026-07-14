function IconBase({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconClose(props) {
  return (
    <IconBase {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </IconBase>
  )
}

export function IconMenu(props) {
  return (
    <IconBase {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </IconBase>
  )
}

export function IconCheck(props) {
  return (
    <IconBase {...props}>
      <polyline points="5 13 10 18 19 7" />
    </IconBase>
  )
}

export function IconArrowLeft(props) {
  return (
    <IconBase {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 5 5 12 12 19" />
    </IconBase>
  )
}

export function IconArrowRight(props) {
  return (
    <IconBase {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </IconBase>
  )
}

export function IconStar(props) {
  return (
    <IconBase fill="currentColor" strokeWidth="1" {...props}>
      <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z" />
    </IconBase>
  )
}

export function IconChart(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="5" width="4" height="15" rx="1" />
      <rect x="16" y="13" width="4" height="7" rx="1" />
    </IconBase>
  )
}

export function IconKey(props) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="15" r="4" />
      <line x1="10.5" y1="12.5" x2="19" y2="4" />
      <line x1="15" y1="8" x2="17.5" y2="10.5" />
      <line x1="17.5" y1="5.5" x2="19.5" y2="7.5" />
    </IconBase>
  )
}

export function IconCalendar(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </IconBase>
  )
}

export function IconMegaphone(props) {
  return (
    <IconBase {...props}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l7 4V5L6 9H4a1 1 0 0 0-1 1Z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
      <path d="M20 7a7.5 7.5 0 0 1 0 10" />
    </IconBase>
  )
}

export function IconFileText(props) {
  return (
    <IconBase {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </IconBase>
  )
}

export function IconImage(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <polyline points="21 16 15 10 5 20" />
    </IconBase>
  )
}

export function IconVideo(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <polygon points="21 7 15 12 21 17 21 7" />
    </IconBase>
  )
}

export function IconPalette(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2a4 4 0 0 0 4-4c0-4.4-4-7.5-9-7.5Z" />
      <circle cx="7.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function IconPaperclip(props) {
  return (
    <IconBase {...props}>
      <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3L15 8.5" />
    </IconBase>
  )
}

export function IconFolder(props) {
  return (
    <IconBase {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </IconBase>
  )
}

export function IconInbox(props) {
  return (
    <IconBase {...props}>
      <path d="M4 12h4l2 3h4l2-3h4" />
      <path d="M5.5 5h13l2 7v6a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-6z" />
    </IconBase>
  )
}

export function IconCheckCircle(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12 11 15 16 9" />
    </IconBase>
  )
}

export function IconUsers(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14.5c2.5.3 4 1.8 4 4.5v1" />
    </IconBase>
  )
}

export function IconLayers(props) {
  return (
    <IconBase {...props}>
      <polygon points="12 3 21 8 12 13 3 8 12 3" />
      <polyline points="3 13 12 18 21 13" />
    </IconBase>
  )
}

export function IconColumns(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="10" rx="1" />
      <rect x="17" y="4" width="5" height="13" rx="1" />
    </IconBase>
  )
}

export function IconWallet(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

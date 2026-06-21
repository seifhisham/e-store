export {}

declare global {
  interface Window {
    fbq?: (
      command: 'track' | 'init' | 'trackCustom',
      eventName: string,
      data?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void
  }
}

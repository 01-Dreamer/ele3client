import { toDataURL } from 'qrcode'

export const createQrCodeDataUrl = (text: string) => {
  return toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 210,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })
}

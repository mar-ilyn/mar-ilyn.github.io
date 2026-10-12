import { CV_URL } from '../config'

// Descarga del CV desde la escena (el sobre del escritorio): el mismo archivo que el botón del header.
export function downloadCv() {
  const a = document.createElement('a')
  a.href = CV_URL
  a.download = ''
  document.body.append(a)
  a.click()
  a.remove()
}

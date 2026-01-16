/**
 * Преобразует URL Google Drive в формат /preview для использования в iframe
 * Поддерживает различные форматы ссылок Google Drive
 */
export function convertGoogleDriveUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg"
  
  // Если это уже не Google Drive ссылка, возвращаем как есть
  if (!url.includes("drive.google.com") && !url.includes("docs.google.com")) {
    return url
  }

  // Извлекаем ID файла из различных форматов Google Drive URL
  let fileId: string | null = null

  // Формат: https://drive.google.com/file/d/FILE_ID/view
  // Формат: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Формат: https://drive.google.com/file/d/FILE_ID/edit
  // Формат: https://drive.google.com/file/d/FILE_ID/preview (уже правильный)
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) {
    fileId = fileIdMatch[1]
    // Если уже в формате /preview, возвращаем как есть
    if (url.includes("/preview")) {
      return url
    }
  }

  // Формат: https://drive.google.com/open?id=FILE_ID
  // Формат: https://drive.google.com/uc?id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && !fileId) {
    fileId = idMatch[1]
  }

  // Формат: https://docs.google.com/document/d/FILE_ID/edit
  // Формат: https://docs.google.com/spreadsheets/d/FILE_ID/edit
  const docsIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (docsIdMatch && !fileId) {
    fileId = docsIdMatch[1]
  }

  // Если нашли ID, преобразуем в формат /preview для iframe
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`
  }

  // Если не удалось извлечь ID, возвращаем оригинальный URL
  return url
}


export const getPageContext = (): string => {
  const path = window.location.pathname
  const ctx: string[] = []

  ctx.push(`页面：${path}`)

  // 提取页面可见文本
  const contentWrap = document.querySelector('.content-wrap')
  if (contentWrap) {
    const text = (contentWrap as HTMLElement).innerText || ''
    // 清理多余空白，截取最多 2000 字
    const cleaned = text.replace(/\n{3,}/g, '\n\n').trim()
    ctx.push(`页面内容：\n${cleaned.slice(0, 2000)}`)
  }

  return ctx.join('\n')
}

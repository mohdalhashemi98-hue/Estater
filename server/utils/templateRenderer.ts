export function renderTemplate(content: string, data: Record<string, any>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
}

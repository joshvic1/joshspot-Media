export function messageClipboardFormats(value) {
  const text = String(value).replace(/\r\n?/g, "\n");
  const escaped = text.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  return {
    text,
    html: `<div>${escaped.replace(/\n/g, "<br>")}</div>`,
  };
}

export async function copyMessage(value) {
  const { text, html } = messageClipboardFormats(value);
  // Rich-text editors can prefer HTML over plain text when pasting.
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      })]);
      return;
    } catch {
      // Some browsers support plain-text copying only.
    }
  }
  await navigator.clipboard.writeText(text);
}

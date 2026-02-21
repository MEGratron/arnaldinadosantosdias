function scoreText(text) {
  const rules = [
    /\b(agora|já|última chance|só hoje|imediatamente)\b/gi,
    /\b(vais perder|perigo|ameaça|arruinado)\b/gi,
    /\b(restam apenas|limitado|exclusivo)\b/gi
  ];
  return Math.min(100, rules.reduce((acc, re) => acc + ((text.match(re) || []).length * 25), 0));
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection()?.toString()?.trim();
      return selection || document.body.innerText.slice(0, 600);
    }
  }, async (results) => {
    const text = results?.[0]?.result || '';
    const score = scoreText(text.toLowerCase());
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (value) => {
        const alert = document.createElement('div');
        alert.textContent = value >= 40 ? '⚠ Linguagem de urgência detetada' : '✓ Sem sinais fortes de urgência';
        alert.style.cssText = 'position:fixed;top:16px;right:16px;z-index:999999;background:#101827;color:#fff;padding:10px 14px;border-radius:10px;border:1px solid #4cc9f0;font:12px sans-serif';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 2800);
      },
      args: [score]
    });
  });
});

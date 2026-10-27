"use strict";

// Pure formatting logic is shared by the page and the local verification script.
(function (root) {
  const handoffFields = [
    ["goal", "任务目标"], ["done", "已完成"], ["todo", "下一步"],
    ["constraints", "约束与边界"], ["artifacts", "产出与验证"], ["unknown", "未确认事项"]
  ];
  function buildHandoff(fields) {
    const sections = handoffFields.map(([key, title]) => {
      const lines = String(fields[key] ?? "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      return `## ${title}\n${(lines.length ? lines : ["未确认"]).map(s => `- ${s}`).join("\n")}`;
    });
    return `# 任务交接单\n\n${sections.join("\n\n")}\n`;
  }
  function nameError(name) {
    if (!name || name === "." || name === "..") return "文件名为空或无效";
    if (/[<>:"/\\|?*\x00-\x1f]/.test(name)) return "含 Windows 不允许的字符，请只填文件名";
    if (/[. ]$/.test(name)) return "文件名不能以空格或句点结尾";
    if (/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(name)) return "属于 Windows 保留名称";
    if (name.length > 255) return "文件名超过 255 个字符";
    return "";
  }
  const nameKey = name => name.normalize("NFC").toLowerCase();
  function previewNames({ names = "", date = "", topic = "", start = "1" } = {}) {
    const errors = [];
    const originals = String(names).split(/\r?\n/).filter(line => line.trim().length > 0);
    if (!originals.length) errors.push("请填写文件名，每行一个。");
    if (originals.length > 200) errors.push("一次最多预览 200 个文件名。");
    const parsed = Date.parse(`${date}T00:00:00Z`);
    if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== date) errors.push("请选择有效日期（年份 1000–9999）。");
    topic = String(topic).trim();
    if (!topic || topic.length > 60 || /[<>:"/\\|?*\x00-\x1f]/.test(topic) || /[. ]$/.test(topic)) errors.push("主题须为 1–60 个字符，不含路径分隔符等非法字符，且不能以句点结尾。");
    const sequence = Number(start);
    if (!/^\d+$/.test(String(start)) || !Number.isSafeInteger(sequence) || sequence < 1 || sequence + originals.length - 1 > 999999) errors.push("序号须为正整数，最后一个序号不能超过 999999。");
    if (errors.length) return { errors, rows: [], issueCount: 0 };
    const sourceCounts = new Map();
    originals.forEach(name => sourceCounts.set(nameKey(name), (sourceCounts.get(nameKey(name)) || 0) + 1));
    const rows = originals.map((original, index) => {
      const dot = original.lastIndexOf(".");
      const extension = dot > 0 ? original.slice(dot) : "";
      const proposed = `${date}-${topic}-${String(sequence + index).padStart(2, "0")}${extension}`;
      const issues = [];
      const originalIssue = nameError(original);
      const targetIssue = nameError(proposed);
      if (originalIssue) issues.push(`原名：${originalIssue}`);
      if (sourceCounts.get(nameKey(original)) > 1) issues.push("原名重复（忽略大小写）");
      if (targetIssue) issues.push(`新名：${targetIssue}`);
      if (nameKey(proposed) !== nameKey(original) && sourceCounts.has(nameKey(proposed))) issues.push("新名与另一项原名冲突");
      return { original, proposed, issues };
    });
    const targetCounts = new Map();
    rows.forEach(row => targetCounts.set(nameKey(row.proposed), (targetCounts.get(nameKey(row.proposed)) || 0) + 1));
    rows.forEach(row => { if (targetCounts.get(nameKey(row.proposed)) > 1) row.issues.push("新名重复"); });
    return { errors, rows, issueCount: rows.filter(row => row.issues.length).length };
  }
  const api = { buildHandoff, previewNames };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FlavorTools = api;
})(typeof window !== "undefined" ? window : globalThis);

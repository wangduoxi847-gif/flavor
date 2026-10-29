"use strict";

(function () {
  const core = window.FlavorTools;
  const handoffForm = document.getElementById("handoff-form");
  const handoffOutput = document.getElementById("handoff-output");
  const handoffStatus = document.getElementById("handoff-status");
  const example = {
    goal: "将通用操作说明整理成可复用文档。",
    done: "已列出标题结构。\n已整理操作步骤。",
    todo: "核对检查项是否齐全。\n确认后导出 Markdown。",
    constraints: "只使用通用样本。\n保留原稿，先预览再确认。",
    artifacts: "说明草稿.md：标题和步骤已整理，检查项待核对。",
    unknown: "最终文件名尚未确认。"
  };
  async function copyOutput(output, status) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(output.value);
      status.textContent = "已复制到剪贴板。";
    } catch {
      output.focus();
      output.select();
      status.textContent = "未能自动复制，已选中全文，请使用系统复制操作。";
    }
  }
  function updateHandoff() {
    const values = Object.fromEntries(new FormData(handoffForm));
    handoffOutput.value = core.buildHandoff(values);
    handoffStatus.textContent = "已更新交接单；未填写的栏目保留为“未确认”。";
  }
  handoffForm.addEventListener("input", updateHandoff);
  handoffForm.addEventListener("submit", e => e.preventDefault());
  function loadHandoffExample() {
    for (const [name, value] of Object.entries(example)) handoffForm.elements.namedItem(name).value = value;
    updateHandoff();
    handoffStatus.textContent = "已载入通用示例，可直接修改。";
  }
  function clearHandoff() {
    handoffForm.reset();
    updateHandoff();
    handoffStatus.textContent = "已清空输入；输出保留空白交接模板。";
  }
  const handoffConfirm = document.getElementById("handoff-confirm");
  const handoffConfirmMessage = document.getElementById("handoff-confirm-message");
  let pendingHandoffAction = null;
  function requestHandoffChange(action, message) {
    const hasInput = [...handoffForm.elements].some(field => typeof field.value === "string" && field.value.length > 0);
    if (!hasInput) { action(); return; }
    pendingHandoffAction = action;
    handoffConfirmMessage.textContent = message;
    handoffConfirm.returnValue = "";
    handoffConfirm.showModal();
  }
  handoffConfirm.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();
    const action = pendingHandoffAction;
    pendingHandoffAction = null;
    handoffConfirm.close();
    if (event.submitter?.value === "confirm" && action) action();
  });
  handoffConfirm.addEventListener("cancel", () => { pendingHandoffAction = null; });
  document.getElementById("handoff-example").addEventListener("click", () => requestHandoffChange(loadHandoffExample, "载入示例会替换当前交接输入，确定继续吗？"));
  document.getElementById("handoff-clear").addEventListener("click", () => requestHandoffChange(clearHandoff, "清空会删除当前交接输入，确定继续吗？"));
  document.getElementById("handoff-copy").addEventListener("click", () => copyOutput(handoffOutput, handoffStatus));
  loadHandoffExample();

  const renameForm = document.getElementById("rename-form");
  const renameRows = document.getElementById("rename-rows");
  const renameOutput = document.getElementById("rename-output");
  const renameStatus = document.getElementById("rename-status");
  const renameCopy = document.getElementById("rename-copy");
  function updateRename() {
    const result = core.previewNames(Object.fromEntries(new FormData(renameForm)));
    renameRows.replaceChildren();
    renameOutput.value = "";
    renameCopy.disabled = true;
    if (result.errors.length) {
      renameStatus.textContent = result.errors.join(" ");
      return;
    }
    for (const row of result.rows) {
      const tr = document.createElement("tr");
      for (const text of [row.original, row.proposed, row.issues.join("；") || "可预览"]) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.append(td);
      }
      if (row.issues.length) tr.className = "rename-issue";
      renameRows.append(tr);
    }
    if (result.issueCount) {
      renameStatus.textContent = `有 ${result.issueCount} 项需要修正，已暂停复制。仅核对本次输入，不检查磁盘中的同名文件。`;
      return;
    }
    renameOutput.value = result.rows.map(row => `${row.original} → ${row.proposed}`).join("\n");
    renameCopy.disabled = false;
    renameStatus.textContent = `已生成 ${result.rows.length} 项预览，未发现本次输入内的名称问题；没有改动任何文件。`;
  }
  renameForm.addEventListener("input", updateRename);
  renameForm.addEventListener("submit", e => e.preventDefault());
  document.getElementById("rename-example").addEventListener("click", () => {
    const values = { names: "新建文档.md\n说明副本.txt\n记录最终版.md", date: "2026-10-26", topic: "资料整理", start: "1" };
    for (const [name, value] of Object.entries(values)) renameForm.elements.namedItem(name).value = value;
    updateRename();
  });
  document.getElementById("rename-clear").addEventListener("click", () => {
    renameForm.reset();
    updateRename();
  });
  renameCopy.addEventListener("click", () => copyOutput(renameOutput, renameStatus));
  document.getElementById("rename-example").click();
})();

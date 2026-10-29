const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHandoff, previewNames } = require('../assets/tools-core.js');

test('empty handoff explicitly keeps all six unknown sections', () => {
  const result = buildHandoff({});
  assert.equal((result.match(/^- 未确认$/gm) || []).length, 6);
  assert.equal((result.match(/^## /gm) || []).length, 6);
});
test('handoff preserves facts and line order without inventing progress', () => {
  const result = buildHandoff({ goal: '  通用说明  ', done: '标题已整理\r\n\r\n步骤已整理', unknown: '检查项待核对' });
  assert.match(result, /## 任务目标\n- 通用说明/);
  assert.match(result, /## 已完成\n- 标题已整理\n- 步骤已整理/);
  assert.match(result, /## 下一步\n- 未确认/);
  assert.match(result, /## 未确认事项\n- 检查项待核对/);
});
test('markup input remains literal text in the generated document', () => {
  assert.ok(buildHandoff({ goal: '<b>通用样例</b>' }).includes('- <b>通用样例</b>'));
});

const sample = { names: '说明.md\n记录.txt', date: '2026-10-26', topic: '资料整理', start: '1' };
test('rename keeps final extension and generates increasing padded numbers', () => {
  const result = previewNames(sample);
  assert.deepEqual(result.rows.map(row => row.proposed), ['2026-10-26-资料整理-01.md','2026-10-26-资料整理-02.txt']);
  assert.equal(result.issueCount, 0);
});
test('rename handles blank lines, CRLF, files without extension and sequence carry', () => {
  const result = previewNames({ ...sample, names: '说明\r\n\r\narchive.tar.gz', start: '99' });
  assert.deepEqual(result.rows.map(row => row.proposed), ['2026-10-26-资料整理-99','2026-10-26-资料整理-100.gz']);
});
for (const date of ['2026-02-29', '2026-13-01', '', '2026-02-30']) {
  test(`invalid date is rejected: ${date}`, () => assert.ok(previewNames({ ...sample, date }).errors.length));
}
test('real leap day is accepted', () => assert.equal(previewNames({ ...sample, date:'2028-02-29' }).errors.length, 0));
for (const start of ['0', '-1', '1.5', '1e2', '999999', '9007199254740993']) {
  test(`invalid or overflowing sequence is rejected: ${start}`, () => assert.ok(previewNames({ ...sample, start }).errors.length));
}
for (const topic of ['', 'a/b', 'bad*name', 'x'.repeat(61), 'topic.']) {
  test(`invalid topic is rejected: ${topic}`, () => assert.ok(previewNames({ ...sample, topic }).errors.length));
}
test('invalid original names are flagged without silently sanitizing them', () => {
  const names = ['CON.txt', 'bad?.md', 'trailing.','note.txt ', ' note.txt', 'COM1', 'LPT².txt', 'folder/note.md', 'x'.repeat(256)];
  const result = previewNames({ ...sample, names:names.join('\n') });
  assert.equal(result.issueCount, names.length);
  assert.deepEqual(result.rows.map(r=>r.original), names);
});
test('a leading space is reported and the original text is preserved', () => {
  const result = previewNames({ ...sample, names: ' note.txt\nnote.txt' });
  assert.equal(result.issueCount, 1);
  assert.equal(result.rows[0].original, ' note.txt');
  assert.match(result.rows[0].issues[0], /空格开头/);
  assert.equal(result.rows[1].issues.length, 0);
});
test('case-insensitive duplicate inputs are flagged', () => assert.equal(previewNames({ ...sample, names:'note.md\nNOTE.md' }).issueCount, 2));
test('target conflicts with another original name are flagged', () => {
  const result = previewNames({ ...sample, names:'note.md\n2026-10-26-资料整理-01.md' });
  assert.ok(result.rows[0].issues.includes('新名与另一项原名冲突'));
});
test('a no-op mapping to its own name is not a conflict', () => assert.equal(previewNames({ ...sample, names:'2026-10-26-资料整理-01.md' }).issueCount, 0));
test('empty and oversized input are rejected', () => {
  assert.ok(previewNames({ ...sample, names:'\n ' }).errors.length);
  assert.ok(previewNames({ ...sample, names:Array.from({length:201},(_,i)=>`demo-${i}.md`).join('\n') }).errors.length);
});

const fs=require('fs'),path=require('path'),assert=require('assert/strict'),root=path.resolve(__dirname,'../..'),ts=require('typescript'),forbidden=new Set(['lib/supabase-admin.ts','app/api/offer-catalog/route.ts','app/api/campaigns/route.ts','app/api/campaign-media/route.ts','lib/campaign-request-body.ts']);let checks=0;const ok=(v,l)=>{assert(v,l);checks++};
// Follow runtime imports/re-exports/dynamic imports/require, but not erased types or server-action bodies.
const files = ['app/admin/AdminHub.tsx','app/components/CampaignPlacements.tsx'];
const roots = files.filter(f => /^\s*['"]use client['"]/m.test(fs.readFileSync(path.join(root, f), 'utf8')));
const visited = new Set();
function walk(file, chain = []) {
  if (visited.has(file)) return;
  visited.add(file);
  ok(!forbidden.has(file), 'forbidden client path: ' + chain.concat(file).join(' -> '));
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  if (ast.statements.some(n => ts.isExpressionStatement(n) && ts.isStringLiteral(n.expression) && n.expression.text === 'use server')) return;
  const imports = [];
  function visit(n) {
    if (ts.isImportDeclaration(n) && !n.importClause?.isTypeOnly) {
      const b = n.importClause?.namedBindings;
      if (!(b && ts.isNamedImports(b) && !n.importClause.name && b.elements.every(e => e.isTypeOnly))) imports.push(n.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(n) && !n.isTypeOnly && n.moduleSpecifier) {
      if (!(n.exportClause && ts.isNamedExports(n.exportClause) && n.exportClause.elements.every(e => e.isTypeOnly))) imports.push(n.moduleSpecifier.text);
    }
    if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || n.expression.getText(ast) === 'require') && ts.isStringLiteral(n.arguments[0])) imports.push(n.arguments[0].text);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  ok(!imports.includes('server-only'), 'client graph must not reach server-only: ' + file);
  for (const name of imports) {
    const base = name.startsWith('@/') ? name.slice(2) : name.startsWith('.') ? path.join(path.dirname(file), name) : null;
    if (!base) continue;
    const target = [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(f => fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile());
    if (target) walk(target, chain.concat(file));
  }
}
roots.forEach(f => walk(f));
console.log(JSON.stringify({status:'PASS',roots:roots.length,reachable:visited.size,checks,violations:0}));

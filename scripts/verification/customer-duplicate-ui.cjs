const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
const source=fs.readFileSync(root+'/app/components/ListingOperationsCenter.tsx','utf8');
const tree=ts.createSourceFile('component.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expression;
function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(tree)==='canDuplicate')expression=n.initializer.getText(tree);ts.forEachChild(n,visit)}visit(tree);
assert.ok(expression);let count=0;
for(const version of [1,null,undefined,'1',0,2,{},true]){
 const actual=vm.runInNewContext(expression,{currentListing:{canonicalDomainVersion:version},lifecycle:{availableActions:['duplicate']}});
 assert.equal(actual,version===1);count++;
}
assert.equal(vm.runInNewContext(expression,{currentListing:{canonicalDomainVersion:1},lifecycle:{availableActions:[]}}),false);count++;
assert.match(source,/if \(!canDuplicate\)\s*\{\s*return/);count++;
assert.match(source,/\{canDuplicate && \(/);count++;
console.log('DUPLICATE UI ASSERTIONS',count);

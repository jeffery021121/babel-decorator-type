
let core = require('@babel/core');
let decoratorsPlugin = require("@babel/plugin-syntax-decorators")
let fs = require('fs');

const readFile = require("util").promisify(fs.readFile);

async function run(filePath) {
  try {
    const fr = await readFile(filePath, "utf-8");
    return fr;
  } catch (err) {
    console.log('Error', err);
  }
}

/*
let code  = `
@dec1('dec1')
class A {
  @dec2
  fn1() { }

  @dec3('dec3', 1, { aa: 1, bb: 'bb' },[1,2,3,{aaa:1}])
  fn2() { }
} 
`
*/

function getType(node) {
  let obj = {}
  if (node.type === 'ObjectExpression') {
    if (node.properties) {
      node.properties.forEach(property => {
        obj[property.key.name] = getType(property.value)
      })
    }

  } else if (node.type === 'ArrayExpression') {
    obj = node.elements.map(element => {
      return getType(element)
    })
  } else {
    return typeof node.value
  }
  return obj
}
const json = {}
let getJson = {
  visitor: {
    Identifier(nodePath, state) {// 只有key,那就是一层调用
      if (nodePath.parentPath.type === 'Decorator') { //找到一个空定义
        json[nodePath.node.name] = { param: [] }
      }
    },
    CallExpression(nodePath, state) {// 函数，多层调用。怎么区分呢？用fn变量区分，这里属于需求不明确
      if (nodePath.parentPath.type === 'Decorator') { //找到一个空定义
        const key = nodePath.node.callee.name
        const { callee, arguments } = nodePath.node
        const param = [{ fn: { param: [] } }]

        arguments.forEach(node => {
          if (node.value) {
            param[0].fn.param.push(typeof node.value)
          } else {
            param[0].fn.param.push(getType(node))
          }

        })
        json[key] = { param }
      }
    },
  }
}

run('./sourceCode.js').then(code=>{
  core.transform(code, {
    plugins: [
      [decoratorsPlugin, { "legacy": true }],
      getJson
    ]
  });

  fs.writeFile('./res.json', JSON.stringify(json, null, 2), function (err, data) {
    if (err) {
      throw err;
    }
  });
})

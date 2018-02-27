const path = require('path')
const debug = require('debug')('static:config')
let config = {
    host:'localhost',//监听主机
    port:8080,//监听端口号
    root:path.resolve(__dirname,'..','public')//根目录
}
console.log(config)
module.exports = config
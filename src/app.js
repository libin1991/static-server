process.env.DEBUG = 'static:*'

const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const util = require('util')
const chalk = require('chalk')
const debug = require('debug')('static:app')
const mime = require('mime')
const handlebars = require('handlebars')
const config = require('./config')

const stat = util.promisify(fs.stat)
const readdir = util.promisify(fs.readdir)
function list(){
    let tmpl = fs.readFileSync(path.resolve(__dirname,'template','list.html'),'utf8')
    return handlebars.compile(tmpl)
}
class Server {
    constructor(argv){
        this.list = list()
        this.config = Object.assign({},this.config,argv)
    }
    start(){
        let server = http.createServer()
        server.on('request',this.request.bind(this))
        server.listen(this.config.port,()=>{
            let url = `${this.config.host}:${this.config.port}`
            debug(`server started at ${chalk.green(url)}`)
        })
    }
    async request(req,res){
        let {pathname} = url.parse(req.url)
        if(pathname == '/favicon.ico' || pathname == '/robots.txt'){
            return this.sendError(req,res)
        }
        let filepath = path.join(this.config.root,pathname)
        try {
            let statObj = await stat(filepath)
            if(statObj.isDirectory()){
                let files = await readdir(filepath)
                files = files.map(file=>({
                    name:file,
                    url:path.join(pathname,file)
                }))
                let html = this.list({
                    title:pathname,
                    files
                })
                res.setHeader('Content-Type','text/html')
                res.end(html)
            }else{
                this.sendFile(req,res,filepath,statObj)
            }
        } catch (error) {
            debug(chalk.red(util.inspect(error)))
            this.sendError(req,res)
        }
    }
    sendFile(req,res,filepath,statObj){
        res.setHeader('Content-Type',mime.getType(filepath))
        fs.createReadStream(filepath).pipe(res)
    }
    sendError(req,res){
        res.statusCode = 500
        res.end('There is some wrong in the server!Please Try later!')
    }
}
module.exports = Server
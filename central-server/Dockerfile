FROM node:20-alpine
WORKDIR /app
RUN echo '{"name":"central-server","version":"1.0.0"}' > package.json
RUN echo 'const http=require("http");http.createServer((_,r)=>{r.end(JSON.stringify({status:"ok"}))}).listen(3000,"0.0.0.0",()=>console.log("stub running"))' > index.js
CMD ["node","index.js"]

var http = require("http");

let h = (r)=>{
let rc='';
for(key in r.headers) rc += '<h3>'+key+':'+r.headers[key]+'</h3>';
return rc;
}


http.createServer((request, response) => {
    let body = "";

    request.on("data", str => {
        body += str;
        console.log('data',body)
    });
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    
    request.on("end", () => {
        response.end(
            '<!DOCTYPE html> <html><head></head>' +
            '<body>' +
            '<h1>Структура запроса</h1>' +
            '<h2>'+ 'метод:' + request.method +'</h2>' +
            '<h2>'+ 'uri:' + request.url +'</h2>' +
            '<h2>'+ 'версия:' + request.httpVersion +'</h2>'+
            '<h2>'+ 'ЗАГОЛОВКИ' +'</h2>' +
            h(request)+
            '<h2>'+ 'тело: '+ body +'</h2>'+
            '</body>'+
            '</html>'
            );
    });

}).listen(3000, () => {
    console.log("Сервер работает на порту 3000");
});

//http://localhost:3000/test
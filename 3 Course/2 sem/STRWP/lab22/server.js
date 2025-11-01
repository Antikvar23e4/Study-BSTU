const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("RS-LAB22-NAV.key"),
  cert: fs.readFileSync("RS-LAB22-NAV.crt"),
};
const port = 3443;
https
  .createServer(options, (req, res) => {
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.url} from ${
        req.socket.remoteAddress
      }`
    );
    res.writeHead(200);
    res.end("Hello from HTTPS server NAV!\nLab 22 Application 22-01");
  })
  .listen(port, () => {
    console.log(
      `HTTPS server NAV running on https://LAB22-NAV:${port} and https://NAV:${port}`
    );
  });

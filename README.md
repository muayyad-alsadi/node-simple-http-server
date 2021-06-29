# SimpleHttpServer

A simple HTTP Server with no dependencies for `NodeJS` using native `http` module in `NodeJS`

## Usage

First install the package

```bash
npm install --save '@alsadi/simple_http_server'
```

Then use it like this in

```javascript
import {SimpleHttpServer} from "@alsadi/simple_http_server"
(async function() {
    const server = new SimpleHttpServer(["assets", "index.html", "favico.ico"], "./public");
    server.listen(8080);
})();
```

## Advanced Usage


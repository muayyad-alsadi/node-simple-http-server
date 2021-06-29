#! /usr/bin/env node
import {SimpleHttpServer} from "@alsadi/simple_http_server"
(async function() {
    const server = new SimpleHttpServer(["assets", "index.html", "favicon.ico"], "./public");
    server.listen(8080);
})();

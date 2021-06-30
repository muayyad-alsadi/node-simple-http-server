import http from "http";
import {CodedError} from "./lib/commons";
import {send_file} from "./lib/http_static_handler";

const leading_slash_regex = /^\/+/;

export class HttpCodedError extends CodedError {
    constructor(code, msg, http_code) {
        if (!http_code) http_code=500;
        super(code, msg);
        this.http_code = http_code;
    }
}


export class PageNotFound extends HttpCodedError {
    constructor() {
        super("not-found", "Page Not Found", 404);
        const uri = this.request?this.request.url:null;
        if (uri) {
            self.message = `Page Not Found [${uri}]`;
        }
    }
}

export class Redirect extends HttpCodedError {
    constructor(uri, http_code) {
        if (!http_code) http_code=302;
        if (http_code!=301 && http_code!=302) {
            throw new CodedError("bad-status-code",
                `redirect code can't be [${http_code}],  it must be 301 or 302`);
        }
        super("moved", `moved to [${uri}]`, http_code);
        this.location = uri;
    }
}

/**
 * SimpleHttpServer
 **/
export class SimpleHttpServer {
    constructor(static_prefixes, static_dir) {
        this.prefixes = new Set(static_prefixes || []);
        this.static_dir = static_dir;
    }

    /**
     * override this method
     * @param {*} request request object (with request.body_promise and request.body_json_parsed)
     * @param {*} response
     */
    async handle(request, response) {
        throw new CodedError("not-implemented", "Not Implemented");
    }

    /**
     * 
     * @param {Error} error 
     * @returns 
     */
    format_error(error) {
        const code = error.code || error.constructor.name
        const message = error.message;
        const trace = (process.env["NODE_ENV"]!="production")?error.stack:null;
        const mime_type = "application/json";
        const obj = {"error": {code, message, trace}};
        const body = JSON.stringify(obj, "utf-8")+"\n";
        return {mime_type, body}
    }


    redirect(response, location, http_code) {
        response.writeHead(http_code || 302, {"Content-Type": "plain/text", "Location": location});
        response.end(location);
    }

    send_exception(response, error, http_code) {
        console.log(error.code, error.message, error.stack);
        if (!http_code && error.http_code) {
            http_code = error.http_code;
        }
        if (error instanceof Redirect || (error.location && (http_code==301 || http_code==302))) {
            return this.redirect(response, error.location, http_code);
        }
        const {mime_type, body} = this.format_error(error);
        response.writeHead(http_code || 500, {"Content-Type": mime_type});
        response.end(body);
    }

    get_body_promise(request) {
        if (request.body_promise) {
            return request.body_promise;
        }
        request.body_promise = new Promise(function(resolve, reject) {
            let data = Buffer.from("");
            request.on("data", (chunk) => {
                data = Buffer.concat([data, chunk]);
            });
            request.on("end", () => {
                resolve(data);
            });
            request.on("error", (err) => {
                reject(err);
            });
        });
        return request.body_promise;
    }
    async before_handle(request, response) {
        const self = this;
        request.body_promise = self.get_body_promise(request);
        if (self.auth) {
            try {
                return await self.auth(request, response);
            } catch (e) {
                self.send_exception(response, e);
                return false;
            }
        }
        return true;
    }
    async handle_static(request, response) {
        const uri = request.url.replace(leading_slash_regex, "");
        const parts = uri.split("/").filter((i)=>i);
        if (!parts.length) return false;
        if (this.prefixes.has(parts[0])) {
            await send_file(response, uri, this.static_dir).catch(console.log);
            return true;
        }
        return false;
    }
    async handle_one(request, response) {
        const self = this;
        if (await self.handle_static(request, response)) {
            return;
        }
        if (!(await self.before_handle(request, response))) return;
        const request_body = request.body_promise;
        let parsed;
        try {
            parsed = JSON.parse((await request_body).toString());
        } catch (e) {
            parsed = {};
        }
        request.body_json_parsed = parsed;
        await self.handle(request, response);
    }

    async handle_w_errors(request, response) {
        const self = this;
        try {
            await self.handle_one(request, response);
        } catch (e) {
            e.request = request;
            e.response = response;
            self.send_exception(response, e);
        }
    }


    listen(port) {
        const self = this;
        return http.createServer((request, response)=>self.handle_w_errors(request, response)).listen(port);
    }
}

import path from "path";
import fs from "fs";

const mime_by_ext = {
    "": "application/octet-stream",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".zip": "application/zip",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

// eslint-disable-next-line security/detect-unsafe-regex
const ext_regex = /(?<ext>\.[^.]+)$/;

export async function send_file(response, uri, dir) {
    const fs_path = path.join(dir, uri.replace(/^\/+/, ""));
    // TODO: handle if side file exists with .gz
    const match = ext_regex.exec(uri);
    const ext = (match)?match.groups.ext:"";
    const mime = mime_by_ext[ext]||mime_by_ext[""];
    let body;
    try {
        body = await fs.promises.readFile(fs_path).catch(console.log);
    } catch (e) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.end("unable to serve file");
        return;
    }
    response.writeHead(200, {"Content-Type": mime});
    response.end(body);
}

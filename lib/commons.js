export class CodedError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

const cookies_regex = /;\s*/;

export function get_cookies(headers) {
    const cookies = headers.cookie || "";
    const cookies_ls = cookies.split(cookies_regex);
    const dict = {};
    for (const cookie_line of cookies_ls) {
        const [key, value] = cookie_line.split("=", 2);
        dict[key] = value;
    }
    return dict;
}



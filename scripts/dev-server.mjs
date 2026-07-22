import { createServer } from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import handler from "../api/interview.js";
import eventsHandler from "../api/events.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
    const envPath = join(root, ".env");
    if (!existsSync(envPath)) return;
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
            process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
        }
    }
}

loadEnv();

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon"
};

const port = Number(process.env.PORT) || 8080;

function serveStatic(pathname, res) {
    let filePath = join(root, pathname === "/" ? "index.html" : pathname);
    if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
    }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("Not found");
        return;
    }
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(readFileSync(filePath));
}

function runApi(apiHandler, req, res, body) {
    const mockReq = {
        method: req.method,
        body: body ? JSON.parse(body) : {}
    };
    const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader(k, v) {
            this.headers[k] = v;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.setHeader("Content-Type", "application/json");
            res.writeHead(this.statusCode, this.headers);
            res.end(JSON.stringify(data));
        },
        end(data) {
            res.writeHead(this.statusCode, this.headers);
            res.end(data || "");
        }
    };
    return apiHandler(mockReq, mockRes);
}

const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    if (url.pathname === "/api/interview" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => runApi(handler, req, res, body));
        return;
    }

    if (url.pathname === "/api/interview" && req.method === "OPTIONS") {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
        return;
    }

    if (url.pathname === "/api/events" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => runApi(eventsHandler, req, res, body));
        return;
    }

    if (url.pathname === "/api/events" && req.method === "OPTIONS") {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
        return;
    }

    serveStatic(url.pathname, res);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Порт ${port} занят. Остановите другой сервер:`);
        console.error(`  lsof -ti :${port} | xargs kill`);
        console.error(`Или запустите на другом порту: PORT=8081 npm run dev`);
        process.exit(1);
    }
    throw err;
});

server.listen(port, () => {
    console.log(`Dev server: http://localhost:${port}`);
    console.log(`API key: ${process.env.OPENROUTER_API_KEY ? "loaded" : "MISSING — add .env"}`);
});

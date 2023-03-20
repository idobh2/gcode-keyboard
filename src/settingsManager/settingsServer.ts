import { promisify, sleep } from "../utils";
import * as wifi from "Wifi";
import * as http from "http";
import settingsEditorHtml from "./settingsEditor/settings.html.js";
import settingsEditorJs from "./settingsEditor/settings.min.js";
import settingsEditorCss from "./settingsEditor/settings.css.js";
import { lcd } from "../devices";
import { readSettings, writeSettings } from "./storage";
import handlers, { HandlerName } from "../gcodeHandlers";

const AP_SSID = "GCode-Keyboard";
const AP_PASS = "12345678";

let lastError = "";

function mainPageHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	rep.writeHead(200, { "Content-Type": "text/html" });
	rep.end(settingsEditorHtml);
}

function mainPageJsHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	rep.writeHead(200, { "Content-Type": "text/html" });
	rep.end(settingsEditorJs);
}
function mainPageCssHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	rep.writeHead(200, { "Content-Type": "text/html" });
	rep.end(settingsEditorCss);
}

function settingsHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	if ("POST" === req.method) {
		let data = "";
		req.on("data", (d) => {
			data += d;
		});
		req.on("end", () => {
			try {
				console.log("Writing settings");
				const body = JSON.parse(data);
				writeSettings(body);
				rep.writeHead(200);
				rep.end();
				setTimeout(() => reset(false), 2000);
			} catch (e) {
				rep.writeHead(500);
				rep.end(e.message ?? e);
			}
		});
	} else {
		rep.writeHead(200, { "Content-Type": "application/json" });
		rep.end(JSON.stringify(readSettings()));
	}
}

function handlerOptionsHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	rep.writeHead(200, { "Content-Type": "application/json" });
	const options = {};
	for (const handlerName in handlers) {
		options[handlerName] = handlers[handlerName as HandlerName].describeDataFields();
	}
	rep.end(JSON.stringify(options));
}

function lastErrorHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	rep.writeHead(200, { "Content-Type": "text/plain" });
	rep.end(lastError);
}

function requestHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	const { pathname = "/" } = url.parse(req.url, true);
	console.log(`Handling path ${pathname}`);
	if ("/" === pathname) {
		return mainPageHandler(req, rep);
	} else if ("/settings.css" === pathname) {
		return mainPageCssHandler(req, rep);
	} else if ("/settings.js" === pathname) {
		return mainPageJsHandler(req, rep);
	} else if ("/settings" === pathname) {
		return settingsHandler(req, rep);
	} else if ("/handlerOptions" === pathname) {
		return handlerOptionsHandler(req, rep);
	} else if ("/lastError" === pathname) {
		return lastErrorHandler(req, rep);
	} else {
		rep.writeHead(404, { "Content-Type": "text/plain" });
		rep.end(`Cannot ${req.method ?? "GET"} ${pathname}`);
	}
}

export function getNetwork() {
	// @ts-expect-error types out of date
	const { status, ssid } = wifi.getDetails();
	if ("connected" === status) {
		// @ts-expect-error types out of date
		const { ip } = wifi.getIP();
		if (ip) {
			return Promise.resolve({ ssid, ip });
		}
	}
	return promisify(wifi.startAP)(AP_SSID, { password: AP_PASS, authMode: "wpa2" })
		.then(() => {
			// @ts-expect-error types out of date
			const { ip } = wifi.getAPIP();
			return {
				ip,
				ssid: AP_SSID
			};
		});
}

export function startSettingsServer(err: Error | null = null) {
	if (err) {
		lastError = err.message ?? err;
	} else {
		lastError = "";
	}
	return getNetwork()
		.then((details) => {
			lcd.clear();
			lcd.print("Settings Config");
			return sleep(2000).then(() => details);
		})
		.then(({ ssid, ip }) => {
			console.log(`Starting settings server. ssid=${ssid} ip=${ip}`);
			lcd.clear();
			lcd.print(ssid);
			lcd.setCursor(0, 1);
			lcd.print(ip);
			http.createServer(requestHandler).listen(80);
		});
}
import { promisify } from "../utils";
import * as wifi from "Wifi";
import * as http from "http";
import settingsHtml from "./settings.html";
import { lcd } from "../devices";

const AP_SSID = "GCode-Keyboard";
const AP_PASS = "12345678";

function mainPageHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	rep.writeHead(200, { "Content-Type": "text/html" });
	rep.end(settingsHtml);
}

function requestHandler(req: http.IncomingMessage, rep: http.ServerResponse<http.IncomingMessage>) {
	const { pathname = "/" } = url.parse(req.url, true);
	if ("/" === pathname) {
		return mainPageHandler(req, rep);
	}
}

export function startSettingsServer() {
	console.log(`Starting settings server. AP_SSID=${AP_SSID} AP_PASS=${AP_PASS}`);
	lcd.clear();
	lcd.print("Settings Config");
	return promisify(wifi.startAP)(AP_SSID, { password: AP_PASS, authMode: "wpa2" })
		.then(() => {
			// @ts-expect-error types not updated
			const { ip } = wifi.getAPIP();
			lcd.setCursor(0, 1);
			lcd.print(ip);
			http.createServer(requestHandler).listen(80);
		});
}
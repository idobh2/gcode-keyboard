import { lcd } from "./devices";
import * as wifi from "Wifi";
import { request } from "./httpUtils";

lcd.clear();
wifi.connect("****", { password: "****" }, async (err) => {
	if (null !== err) {
		lcd.print("Couldn't connect");
		return;
	}
	lcd.print("Connected");
	const response = await request("http://****:8080");
	lcd.setCursor(0, 1);
	lcd.print(response);
});
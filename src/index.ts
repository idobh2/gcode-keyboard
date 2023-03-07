import Encoder from "./Encoder";
import { ENCODER_PIN_A, ENCODER_PIN_B } from "./pins";

const encoder = new Encoder(ENCODER_PIN_A, ENCODER_PIN_B);

encoder.register((dir) => {
	console.log("Dir change", dir);
});
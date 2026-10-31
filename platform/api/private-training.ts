import { privateTraining } from "../src/handlers/private-training.js";
import { getDeps } from "../src/lib/deps.js";
import { endpoint } from "../src/lib/http.js";

export const POST = endpoint("private_training", (req) => privateTraining(req, getDeps()));
export const OPTIONS = POST;

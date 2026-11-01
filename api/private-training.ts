import { privateTraining } from "../platform/src/handlers/private-training.js";
import { getDeps } from "../platform/src/lib/deps.js";
import { endpoint } from "../platform/src/lib/http.js";

export const POST = endpoint("private_training", (req) => privateTraining(req, getDeps()));
export const OPTIONS = POST;

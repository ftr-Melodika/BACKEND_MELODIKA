import 'dotenv/config';
import express from "express";
import cors from "cors";
import fs from "fs";
import swaggerUi from "swagger-ui-express";

import cuentaController from "./controllers/cuentaController.js";
import perfilController from "./controllers/perfilController.js";
import cursoController from "./controllers/cursoController.js";
import { errorHandler } from "./middlewares/errorHandler.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/cuentas", cuentaController);
app.use("/api/perfiles", perfilController);
app.use("/api/cursos", cursoController);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json', 'utf-8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});


import 'dotenv/config';
import express from "express"
import cors from "cors"
import cuentaController from "./controllers/cuentaController.js";
import perfilController from "./controllers/perfilController.js";
import cursoController from "./controllers/cursoController.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use("/api/cuentas", cuentaController);
app.use("/api/perfiles", perfilController);
app.use("/api/cursos", cursoController);

app.get('/', (req, res) => {
res.send('Hello World!');
}) 

app.listen(port, () => {
console.log(`Listening on http://localhost:${port}`)
})


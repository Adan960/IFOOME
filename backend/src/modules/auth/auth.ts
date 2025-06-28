import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json());

router.post("/backend/teste",(req,res):void => {
    const nome = req.body.nome;
    
    res.send("Olá " + nome);
});
 
export default router;
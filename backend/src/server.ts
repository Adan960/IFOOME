import app from './app';

app.listen(process.env.PORT, ():void => {
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}/backend/`);
})
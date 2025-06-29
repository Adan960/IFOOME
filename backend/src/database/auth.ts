import dbConfig from './config';

function criarLogin(email: string, senha: string) {
    console.log(dbConfig(
        'INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3) RETURNING *',
        [email, senha, 0]
    ))
}

export default {
    criarLogin
}
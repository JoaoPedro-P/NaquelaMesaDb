const express = require("express");
const { Client } = require('pg');
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());

var conString = config.urlConnection;
var client = new Client(conString);
client.connect(function (err) {
    if (err) {
        return console.error('Não foi possível conectar ao banco.', err);
    }
    client.query('SELECT NOW()', function (err, result) {
        if (err) {
            return console.error('Erro ao executar a query.', err);
        }
        console.log(result.rows[0]);
    });
});

app.get("/", (req, res) => {
    console.log("Response ok.");
    res.send("Ok - Servidor disponível.");
});
app.listen(config.port, () =>
    console.log("Servidor funcionando na porta " + config.port)
);

app.delete("/usuarios/:id", (req, res) => {
    try {
        console.log("Chamou delete /:id " + req.params.id);
        const id = req.params.id;
        client.query(
            "DELETE FROM Usuarios WHERE id = $1",
            [id],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de DELETE", err);
                } else {
                    if (result.rowCount == 0) {
                        res.status(400).json({ info: "Registro não encontrado." });
                    } else {
                        res.status(200).json({ info: `Registro excluído. Código: ${id}` });
                    }
                }
                console.log(result);
            }
        );
    } catch (error) {
        console.log(error);
    }
});

app.post("/usuarios", (req, res) => {
    try {
        console.log("Chamou post", req.body);
        const { nome, senha, telefone, email } = req.body;
        client.query(
            "INSERT INTO Usuarios (nome, senha, telefone, email) VALUES ($1, $2, $3, $4) RETURNING * ",
            [nome, senha, telefone, email],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de INSERT", err);
                }
                const { id } = result.rows[0];
                res.setHeader("id", `${id}`);
                res.status(201).json(result.rows[0]);
                console.log(result);
            }
        );
    } catch (erro) {
        console.error(erro);
    }
});

app.put("/usuarios/:id", (req, res) => {
    try {
        console.log("Chamou update", req.body);
        const id = req.params.id;
        const { nome, senha, telefone } = req.body;
        client.query(
            "UPDATE Usuarios SET nome=$1, senha=$2, telefone=$3 WHERE id =$4 ",
            [nome, senha, telefone, id],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de UPDATE", err);
                } else {
                    res.setHeader("id", id);
                    res.status(202).json({ id: id });
                    console.log(result);
                }
            }
        );
    } catch (erro) {
        console.error(erro);
    }
});


app.post("/pedidos", (req, res) => {
    try {
        console.log("Chamou post", req.body);
        const { preco_final, pratos_pedidos, usuario_id } = req.body;
        client.query(
            "INSERT INTO pedidos (preco_final, pratos_pedidos, usuario_id) VALUES ($1, $2, $3) RETURNING * ",
            [preco_final, pratos_pedidos, usuario_id],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de INSERT", err);
                }
                const { id } = result.rows[0];
                res.setHeader("id", `${id}`);
                res.status(201).json(result.rows[0]);
                console.log(result);
            }
        );
    } catch (erro) {
        console.error(erro);
    }
});

app.get("/pedidos", (req, res) => {
    try {
        client.query("SELECT * FROM pedidos", function
            (err, result) {
            if (err) {
                return console.error("Erro ao executar a qry de SELECT", err);
            }
            res.send(result.rows);
            console.log("Chamou get pedidos");
        });
    } catch (error) {
        console.log(error);
    }
});

app.get("/pedidos/:id", (req, res) => {
    try {
        console.log("Chamou /:id " + req.params.id);
        client.query(
            "SELECT * FROM pedidos WHERE id = $1",
            [req.params.id],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de SELECT id", err);
                }
                res.send(result.rows);
                //console.log(result);
            }
        );
    } catch (error) {
        console.log(error);
    }
});

app.get("/autenticar", (req, res) => {
    try {
        console.log("Chamou /autenticar");
        const email = req.query.email;
        const senha = req.query.senha;
        client.query(
            "SELECT * FROM usuarios WHERE email = $1 AND senha = $2",
            [email, senha],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de SELECT email e senha", err);
                }
                if (result.rows.length > 0) {
                    // Agora, o endpoint retorna o nome, email, telefone e id do usuário autenticado
                    res.send({
                        id: result.rows[0].id,
                        nome: result.rows[0].nome,
                        email: result.rows[0].email,
                        telefone: result.rows[0].telefone
                    });
                } else {
                    res.send({ message: "Usuário não tem acesso." });
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
});


module.exports = app;
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

app.post("/pedidos", (req, res) => {
    try {
        console.log("Chamou post", req.body);
        const { preco_final, pratos_pedidos, id_usuario } = req.body;

        // Primeiro, inserimos na tabela 'pedidos'
        client.query(
            "INSERT INTO pedidos (preco_final, id_usuario) VALUES ($1, $2) RETURNING id_pedido",
            [preco_final, id_usuario],
            function (err, result) {
                if (err) {
                    return console.error("Erro ao executar a qry de INSERT em pedidos", err);
                }
                console.log(result.rows[0]);
                const pedidoId = result.rows[0].id_pedido;
                
                // Agora, para cada prato, inserimos na tabela 'pedido_prato'
                pratos_pedidos.forEach((prato) => {
                    const { id_prato, quantidade } = prato;

                    client.query(
                        "INSERT INTO pedido_prato (id_pedido, id_prato, quantidade) VALUES ($1, $2, $3)",
                        [pedidoId, id_prato, quantidade],
                        function (err) {
                            if (err) {
                                return console.error("Erro ao executar a qry de INSERT em pedido_prato", err);
                            }
                        }
                    );
                });

                res.setHeader("id", `${pedidoId}`);
                res.status(201).json({ id: pedidoId });
            }
        );
    } catch (erro) {
        console.error(erro);
        res.status(500).send("Erro interno do servidor");
    }
});

app.get("/pratos", (req, res) => {
    try {
        client.query("SELECT * FROM pratos", function
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
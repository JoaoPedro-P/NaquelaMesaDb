const express = require("express");
const { Client } = require('pg');
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


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

/**
 * @swagger
 * /:
 *   get:
 *     summary: Endpoint de teste para conexão do servidor
 *     description: Apenas para teste
 *     responses:
 *       200:
 *         description: Sucesso
 */

app.get("/", (req, res) => {
    console.log("Response ok.");
    res.send("Ok - Servidor disponível.");
});
app.listen(config.port, () =>
    console.log("Servidor funcionando na porta " + config.port)
);


/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: ID do usuário a ser excluído
 *     summary: Endpoint para remoção de usuários
 *     description: Este endpoint é responsável por excluir do banco de dados o usuário com id informado
 *     responses:
 *       200:
 *         description: Sucesso
 */
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


/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Endpoint para criação de usuários
 *     description: Este endpoint é responsável por criar no banco de dados os usuários.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: O nome do usuário.
 *                 example: Leanne Graham
 *               email:
 *                 type: string
 *                 format: email
 *                 description: O endereço de e-mail do usuário.
 *                 example: user@example.com
 *               senha:
 *                 type: string
 *                 description: A senha do usuário.
 *                 example: mypassword
 *               telefone:
 *                 type: string
 *                 description: O número de telefone do usuário.
 *                 example: "+55 11 1234-5678"
 *     responses:
 *       201:
 *         description: Criado
 */
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

/**
 * @swagger
 * /pratos:
 *   post:
 *     summary: Endpoint para criação de pratos
 *     description: Este endpoint é responsável por criar no banco de dados os pratos da aplicação.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: string
 *                 description: id do usuário que fez o pedido.
 *                 example: 2
 *               pratos_pedidos:
 *                 type: array
 *                 description: Vetor dos pratos pedidos
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_prato:
 *                       type: string
 *                       description: ID do prato.
 *                       example: 1
 *                     quantidade:
 *                       type: integer
 *                       description: Quantidade do prato.
 *                       example: 2
 *               preco_final:
 *                 type: integer
 *                 description: Valor final do pedido
 *                 example: 175
 *     responses:
 *       201:
 *         description: Criado
 */
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


/**
 * @swagger
 * /pratos:
 *   get:
 *     summary: Endpoint para mostrar todos os pratos
 *     description: Este endpoint é responsável por buscar do banco de dados todos os pratos.
 *     responses:
 *       200:
 *         description: Sucesso
 */
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


/**
 * @swagger
 * /autenticar:
 *   get:
 *     summary: Endpoint para autenticar um usuário
 *     description: |
 *       Este endpoint é responsável por autenticar um usuário a partir do email e da senha.
 *       Os parâmetros de consulta (query parameters) email e senha devem ser fornecidos.
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: O endereço de e-mail do usuário.
 *         example: user@example.com
 *       - in: query
 *         name: senha
 *         schema:
 *           type: string
 *         required: true
 *         description: A senha do usuário.
 *         example: mypassword
 *     responses:
 *       200:
 *         description: Sucesso
 */
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
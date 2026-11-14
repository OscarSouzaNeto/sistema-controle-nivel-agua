require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Lê as configurações do ambiente (.env). Nenhuma chave fica no código.
function requireEnv(...names) {
    const missing = names.filter((n) => !process.env[n]);
    return missing;
}

// Envia um SMS de alerta pelo Twilio
app.post('/sendSMS', async (req, res) => {
    const { phoneNumber, message } = req.body || {};

    if (typeof phoneNumber !== 'string' || !/^\+?[0-9]{10,15}$/.test(phoneNumber.trim())) {
        return res.status(400).send({ success: false, error: 'Número de telefone inválido.' });
    }
    if (typeof message !== 'string' || message.trim() === '' || message.length > 320) {
        return res.status(400).send({ success: false, error: 'Mensagem inválida (1 a 320 caracteres).' });
    }

    const missing = requireEnv('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER');
    if (missing.length) {
        return res.status(500).send({ success: false, error: `Configuração ausente: ${missing.join(', ')}` });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    try {
        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
            new URLSearchParams({
                To: phoneNumber.trim(),
                From: process.env.TWILIO_PHONE_NUMBER,
                Body: message.trim()
            }),
            {
                auth: { username: sid, password: token },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        console.log('Mensagem SMS enviada com sucesso!');
        res.status(response.status).send({ success: true });
    } catch (error) {
        console.error('Erro ao enviar mensagem SMS:', error.message);
        res.status(500).send({ success: false, error: 'Não foi possível enviar o SMS.' });
    }
});

// Busca os últimos registros do canal no ThingSpeak
app.get('/data', async (req, res) => {
    const missing = requireEnv('THINGSPEAK_CHANNEL_ID', 'THINGSPEAK_READ_API_KEY');
    if (missing.length) {
        return res.status(500).send({ error: `Configuração ausente: ${missing.join(', ')}` });
    }

    try {
        const response = await axios.get(
            `https://api.thingspeak.com/channels/${process.env.THINGSPEAK_CHANNEL_ID}/feeds.json`,
            { params: { api_key: process.env.THINGSPEAK_READ_API_KEY, results: 100 } }
        );
        res.status(200).send(response.data.feeds);
    } catch (error) {
        console.error('Erro ao buscar dados do ThingSpeak:', error.message);
        res.status(500).send({ error: 'Erro ao buscar dados do ThingSpeak' });
    }
});

// Expõe só o limite configurado, para o front-end usar no indicador
app.get('/config', (req, res) => {
    res.send({ limite: Number(process.env.LIMITE_NIVEL_CM) || 200 });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

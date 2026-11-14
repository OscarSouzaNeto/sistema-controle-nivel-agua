// Verificador automático: consulta o último valor no ThingSpeak a cada 5 minutos
// e envia um SMS quando o nível ultrapassa o limite configurado.
// Uso: npm run alerta
require('dotenv').config();
const twilio = require('twilio');

const {
    THINGSPEAK_CHANNEL_ID,
    THINGSPEAK_READ_API_KEY,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    ALERT_RECIPIENT_NUMBER
} = process.env;

const LIMITE = Number(process.env.LIMITE_NIVEL_CM) || 200;
const INTERVALO_MS = 5 * 60 * 1000;

const faltando = [
    'THINGSPEAK_CHANNEL_ID', 'THINGSPEAK_READ_API_KEY', 'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'ALERT_RECIPIENT_NUMBER'
].filter((n) => !process.env[n]);

if (faltando.length) {
    console.error(`Configure no .env: ${faltando.join(', ')}`);
    process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function buscarUltimoNivel() {
    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/fields/1/last.json?api_key=${THINGSPEAK_READ_API_KEY}`;
    try {
        const response = await fetch(url); // fetch nativo (Node 18+)
        if (!response.ok) {
            console.error('Erro ao buscar dados do ThingSpeak:', response.statusText);
            return null;
        }
        const data = await response.json();
        return parseFloat(data.field1);
    } catch (error) {
        console.error('Erro ao buscar dados do ThingSpeak:', error.message);
        return null;
    }
}

async function verificarEAlertar() {
    const nivel = await buscarUltimoNivel();
    if (nivel === null || Number.isNaN(nivel)) return;

    console.log(`Nível atual: ${nivel} cm (limite: ${LIMITE} cm)`);
    if (nivel > LIMITE) {
        try {
            const msg = await client.messages.create({
                body: `Aviso: nível de água em ${nivel} cm, acima do limite de ${LIMITE} cm.`,
                from: TWILIO_PHONE_NUMBER,
                to: ALERT_RECIPIENT_NUMBER
            });
            console.log('SMS enviado, SID:', msg.sid);
        } catch (error) {
            console.error('Erro ao enviar SMS:', error.message);
        }
    }
}

verificarEAlertar();
setInterval(verificarEAlertar, INTERVALO_MS);

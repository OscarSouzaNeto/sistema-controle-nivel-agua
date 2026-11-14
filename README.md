# Sistema de Controle de Nível de Água

Dashboard web para monitoramento de nível de água, com leitura de dados pelo **ThingSpeak** e envio de **alertas por SMS** pelo **Twilio**. Projeto acadêmico desenvolvido durante o curso Técnico em Desenvolvimento de Sistemas no **SENAI**.

## O que o projeto faz

- Busca as últimas leituras do canal do ThingSpeak e mostra em um **gráfico em tempo quase real** (atualiza a cada 30 segundos).
- Exibe **medidores** com o último valor e um indicador de nível normal ou acima do limite.
- Permite **enviar SMS de alerta** manualmente por um formulário.
- Inclui um **verificador automático** (`npm run alerta`) que consulta o ThingSpeak a cada 5 minutos e envia SMS quando o nível passa do limite.

## Tecnologias

- Node.js e Express (API e servidor de arquivos estáticos)
- HTML, CSS e JavaScript puro no front-end
- Chart.js (gráfico)
- ThingSpeak (origem dos dados) e Twilio (SMS)

## Como rodar

Pré-requisito: Node.js 18 ou superior.

```bash
git clone <url-deste-repositorio>
cd sistema-controle-nivel-agua
npm install
cp .env.example .env     # preencha com as suas chaves
npm start
```

Depois abra `http://localhost:3002`.

Para rodar o verificador automático de alertas:

```bash
npm run alerta
```

## Variáveis de ambiente

As chaves ficam no arquivo `.env`, que **não é enviado ao GitHub**. Veja `.env.example` para a lista completa:

| Variável | Para que serve |
|---|---|
| `THINGSPEAK_CHANNEL_ID` | ID do canal do ThingSpeak |
| `THINGSPEAK_READ_API_KEY` | Chave de leitura do canal |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Credenciais da conta Twilio |
| `TWILIO_PHONE_NUMBER` | Número remetente do SMS |
| `ALERT_RECIPIENT_NUMBER` | Número que recebe os alertas automáticos |
| `LIMITE_NIVEL_CM` | Limite de nível em cm (padrão: 200) |

## Estrutura

```
├── server.js          # API (/data, /config, /sendSMS) e arquivos estáticos
├── alertChecker.js    # verificador automático de alertas
├── public/
│   ├── index.html     # dashboard
│   ├── app.js         # gráfico, medidores e formulário de SMS
│   └── styles.css
├── .env.example
└── package.json
```

## Observações

- Projeto de estudo. O endpoint `/sendSMS` não tem autenticação, então **não deve ser exposto na internet** como está.
- Os campos `field1` e `field2` do ThingSpeak são lidos como Medidor 1 e Medidor 2.

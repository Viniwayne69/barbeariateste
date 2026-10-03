# Noir Barber

Aplicativo web de agendamento para barbearia premium, construído com Next.js, React e TypeScript.

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Funcionalidades

- Fluxo de agendamento em quatro etapas
- Seleção de serviço, data e horário
- Calendário dinâmico com datas reais
- Máscara brasileira para WhatsApp
- Validação dos dados do cliente
- Persistência local de reservas
- Verificação de conflito antes da confirmação

## Configuração

Os serviços, horários e imagem principal ficam em `src/lib/config.ts`.

As reservas são salvas localmente em `data/appointments.json`, arquivo ignorado pelo Git para não publicar dados de clientes.

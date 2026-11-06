# Discord Embed Bot

Bot para substituir links e gerar embeds em qualquer servidor Discord em que estiver instalado.

## VM com Docker Compose

1. Copie `.env.example` para `.env` e preencha `BOT_TOKEN`, `BOT_OWNER_ID` e `DB_PASS`. Ajuste `DB_NAME` e `DB_USER` se necessario. Nunca versione arquivos com credenciais.
2. No Discord Developer Portal, habilite o intent Message Content. Convide o bot para os servidores desejados com os escopos `bot` e `applications.commands`. Conceda View Channel, Send Messages, Read Message History e Embed Links; Manage Messages permite suprimir o embed original.
3. Execute:

```sh
docker compose up -d --build
docker compose ps
docker compose logs -f discordembedbot
```

O Compose carrega `.env` automaticamente para preencher as variaveis dos servicos. Para escolher outro arquivo, use o mesmo argumento em todos os comandos:

```sh
docker compose --env-file .env.production up -d --build
```

`DB_HOST=postgres` e `DB_PORT=5432` sao definidos pelo Compose para a rede interna. O PostgreSQL e o endpoint de saude nao publicam portas em producao. Os logs possuem rotacao. O volume `postgres18_data` persiste os dados; mantenha backups antes de migrar ou atualizar. Alterar usuario/senha no arquivo env nao altera credenciais de um volume PostgreSQL existente.

O bot aplica o schema em transacao no startup, incluindo a tabela de respostas para volumes existentes. O usuario do banco precisa ser dono das tabelas. Os seeds de regras sao executados somente na inicializacao de um volume vazio; nao sobrescrevem configuracoes nem recriam regras removidas em reinicios. `npm run db:init` reaplica apenas o schema.

Os comandos sao registrados globalmente e funcionam em qualquer guild; DMs sao ignoradas. `BOT_OWNER_ID` e o ID do seu usuario Discord, e somente esse usuario pode executar `/url`, mesmo que outro usuario seja administrador do servidor. As regras de URL e a preferencia pessoal de `/track` sao globais entre servidores. Comandos globais podem levar algum tempo para aparecer no Discord. Se voce ja executou uma versao com comandos por guild, remova os registros antigos da guild para evitar duplicacao.

O healthcheck verifica cliente Discord, registro dos comandos e banco. O estado `unhealthy` exige investigacao; o Compose reinicia processos que encerram, mas nao reinicia um container apenas por estar unhealthy.

## Imagens e migracao do PostgreSQL

A imagem do bot usa `node:26-alpine` e o banco usa `postgres:18-alpine`. As tags fixam a versao principal e recebem atualizacoes de correcao. O CI tambem usa Node 26. Fontes: [versoes Node](https://nodejs.org/en/about/previous-releases), [imagem oficial PostgreSQL](https://hub.docker.com/_/postgres).

Para atualizar as imagens dentro dessas versoes:

```sh
docker compose pull postgres
docker compose build --pull discordembedbot
docker compose up -d
```

PostgreSQL 18 usa o volume em `/var/lib/postgresql`. O volume foi renomeado para `postgres18_data` para nao tentar abrir os arquivos de um PostgreSQL 15. O volume antigo `postgres_data` permanece intacto. Na VM nova sem dados anteriores, basta iniciar o Compose. Em uma instalacao existente, a nova imagem inicia um banco vazio ate a restauracao; nao inicie o bot antes de migrar.

Para preservar dados existentes, na instalacao antiga, **antes de atualizar o Compose**, interrompa as escritas e exporte um dump:

```sh
docker compose stop discordembedbot
docker compose exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/bot.dump'
docker compose cp postgres:/tmp/bot.dump ./bot.dump
```

Transfira o dump para a VM nova de forma segura. Depois de atualizar o Compose, inicie apenas o banco novo e restaure:

```sh
docker compose up -d postgres
# Aguarde o PostgreSQL ficar healthy antes de restaurar.
docker compose cp ./bot.dump postgres:/tmp/bot.dump
docker compose exec postgres sh -c 'pg_restore --exit-on-error --single-transaction --clean --if-exists --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/bot.dump'
docker compose up -d --build discordembedbot
```

Valide as regras, preferencias e respostas antes de desativar o ambiente antigo. Dumps contem dados do bot: armazene fora do repositorio. Nao apague o volume antigo ate validar a restauracao. Upgrade de versao principal exige dump/restore ou `pg_upgrade`, conforme a [documentacao PostgreSQL](https://www.postgresql.org/docs/current/upgrading.html).

## Comandos

- `/track activated:true|false`: altera o rastreamento das suas mensagens.
- `/url list page:1`: lista quatro regras por pagina.
- `/url add`, `/url update`, `/url remove`: gerenciam regras, exclusivos do usuario definido em `BOT_OWNER_ID`.

As respostas dos comandos sao privadas. As mensagens do bot contem somente links convertidos, sem processar mencoes, respeitando 2000 caracteres. Links excedentes sao omitidos inteiros. As regras usam regex JavaScript sem delimitadores; substituicoes aceitam grupos `$1`, `$2`, etc. Somente o dono do bot pode configurar regex. A execucao ocorre em workers isolados: `REGEX_TIMEOUT_MS` define o prazo por mensagem (padrao 500 ms, incluindo inicializacao do worker; faixa de 50 a 5000 ms). Ao exceder o prazo, o worker e encerrado, o erro e registrado e a resposta existente e preservada. Ha no maximo quatro workers simultaneos; mensagens acima dessa capacidade sao descartadas com erro no log, sem alterar respostas existentes.

A relacao entre mensagem e resposta fica no PostgreSQL e sobrevive a reinicios. Edicoes podem criar, atualizar ou remover respostas. Exclusoes individuais e em lote removem as respostas associadas. Eventos ocorridos enquanto o bot esta offline nao sao recuperados retroativamente.

## Desenvolvimento

Use Node 26 LTS, igual a imagem e ao CI:

```sh
npm ci
docker compose -f docker-compose.yml -f docker-compose.debug.yml up -d postgres
npm run dev
```

O processo local le `.env`; para outro arquivo, defina `ENV_FILE` no ambiente. Localmente use `DB_HOST=localhost`. O override de debug publica PostgreSQL e inspector somente em loopback.

```sh
npm run build
npm test -- --runInBand
```

Os testes Jest em `src/__tests__/*.test.ts` cobrem helpers, models, servico de URLs e sincronizacao de mensagens com dependencias simuladas. A integracao com Discord e PostgreSQL requer validacao em ambiente de teste. O build de producao exclui os testes.

## Regras padrao

Em uma VM com volume PostgreSQL novo, o seed carrega as regras corrigidas automaticamente. Ele protege o dominio e os identificadores completos. Parametros e fragmentos sao removidos; caminhos de foto/video do X sao preservados. O extrator normaliza maiusculas no dominio e remove pontuacao de texto ao redor dos links, preservando parenteses balanceados. Links curtos do TikTok e stories do Instagram continuam fora das regras padrao.

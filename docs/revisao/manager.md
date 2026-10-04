# Revisão do manager

Data: 26/09/2026. Base e orientações: [README](README.md). Status: análise concluída; M04, M06, M08, M09, M10, M11, M12, M13, M14 e M15 corrigidos localmente com autorização posterior do responsável. Demais itens conforme registros abaixo.

## Escopo e verificação

Foram examinados autenticação/autorização, rotas, controladores, serviços, schemas, modelos, configuração, migrações relacionadas às relações/portas e o contrato Swagger, com cruzamentos no worker e na web app. Não houve execução em MySQL, Docker, SMTP ou S3 reais, nem auditoria de CVEs de dependências.

`npm run docs:validate` passou: **41 paths, 58 operations**. Reproduções isoladas confirmaram a porta ocupada sendo escolhida novamente, o erro de Promise na criação de arquivos e o comportamento do schema de atualização. Um SQLite novo em `/tmp`, com usuários/worker fictícios e modelos sincronizados, confirmou colisão na segunda criação, exposição de histórico ao link sem permissões e validade do JWT anterior após reset de senha. Esse teste não executou as migrações do projeto. Achados por leitura de fluxo estão explicitamente descritos; não são apresentados como testes de produção.

## Lista de correções

### [x] M01 — P1 — Alocador reutiliza a primeira porta ocupada

- **Local:** `manager/src/services/Instance.js:187` (`selectPort`).
- **Evidência:** só adiciona portas usadas quando `serverPort > minPort && serverPort < maxPort`, mas seleciona no intervalo inclusivo. Com `5621` ocupada, a função retornou `5621` novamente em reprodução isolada.
- **Impacto:** a segunda criação no mesmo worker colide com `instance_worker_id_port_unique` (confirmado em SQLite isolado: `SequelizeUniqueConstraintError`); remap também pode manter a porta atual. O índice evita duplicação persistida, mas não torna a operação funcional. A seleção antes da transação também não trata colisões concorrentes.
- **Correção prevista:** respeitar os dois limites inclusivos, detectar esgotamento e tratar concorrência com reserva/repetição limitada.
- **Contrato/consumidores:** criação, remap e troca de worker; conferir Swagger e mensagens exibidas pela web. Testar limites e criações simultâneas.

### [x] M02 — P1 — Criação de arquivo sempre entrega uma Promise ao leitor de resposta

- **Local:** `manager/src/controllers/File.js:52`; `manager/src/utils/proxyFetch.js:57`.
- **Evidência:** falta `await proxyToWorker(...)`; `sendWorkerJson` chama `response.text()` diretamente. Reprodução: `response.text is not a function`.
- **Impacto:** a API responde erro mesmo quando o worker acaba criando o arquivo. Nova tentativa pode responder “já existe”. A requisição ao worker fica sem acompanhamento e sua rejeição pode ficar sem tratamento.
- **Correção prevista:** aguardar e tratar a resposta e a falha do proxy.
- **Contrato/consumidores:** `POST /instance/{id}/files/create` promete 201 no Swagger; afeta `instancesApi.createFile`.

### [x] M03 — P1 — Upload perde o Content-Type multipart e seu boundary

- **Local:** `manager/src/controllers/File.js:69`; `manager/src/utils/proxyFetch.js:25–39`.
- **Evidência:** encaminha `req` como stream, mas fixa `Content-Type: application/json`; o controller não repassa o cabeçalho multipart original.
- **Impacto:** `express.json()` do worker tenta interpretar os bytes multipart como JSON ou rejeita por tamanho; o Multer não recebe a requisição esperada. Upload da web falha.
- **Correção prevista:** preservar o Content-Type/boundary do upload e testar o fluxo completo, inclusive erros e interrupções.
- **Contrato/consumidores:** Swagger de upload especifica `multipart/form-data`; a web usa `FormData`/XHR corretamente nesse ponto.

### [x] M04 — P1 — Reinício contorna as cotas de CPU, memória e disco

- **Local:** `manager/src/controllers/Instance.js:158`; comparar `run:105` e `update:50`; `worker/src/services/Server.js` (`restart`).
- **Evidência:** apenas `run` chama `Limit.verifyCanStart`. `restart` não exige instância já ligada e o worker sempre executa stop seguido de run. A edição aceita aumentar memória/CPU sem verificar quota.
- **Reprodução por fluxo:** criar uma instância permitida, pará-la, aumentar seus recursos acima da quota e chamar `/restart`; a requisição é encaminhada sem a checagem presente em `/run`.
- **Impacto:** usuário com `instance:execute` consegue iniciar recursos que sua quota proíbe, consumindo capacidade compartilhada.
- **Correção prevista:** aplicar admissão de recursos a qualquer caminho que inicia container, tratando corretamente recursos já reservados no reinício.
- **Contrato/consumidores:** revisar `/run`, `/restart`, edição e respostas 403; controles da web não substituem a checagem no servidor.
- **Correção implementada (29/09/2026):** `/restart` verifica as cotas do proprietário antes de chamar o worker. O cálculo exclui apenas a alocação de CPU/memória da própria instância e soma a configuração solicitada uma vez, preservando seu disco e sua contagem. Edições que informam CPU ou memória validam a configuração resultante contra os limites individuais do proprietário antes de gravar; instâncias paradas não reservam recursos agregados.
- **Validação:** 18 testes isolados em `manager/test/instance-quotas.test.mjs` passaram, com persistência e transporte simulados: início/reinício dentro e fora das cotas, reinício sem dupla contagem, consumo de outras instâncias, bloqueio antes do envio ao worker, edição recusada sem gravação e validação dos valores padrão na criação. Executar com `node --experimental-vm-modules test/instance-quotas.test.mjs` no manager. ESLint dos três arquivos de código alterados e `npm run docs:validate` passaram (41 caminhos, 58 operações). Sem execução em banco ou worker reais.
- **Integração e limite:** Swagger de início, reinício e edição atualizado; formatos preservados. A web já trata erros de edição e reinício; o contrato do worker permanece compatível. M05 continua pendente por decisão do responsável: esta correção não implementa reserva ou serialização de operações concorrentes.

### [x] M05 — P1 — Checagem de cotas e início/criação não são atômicos

- **Local:** `manager/src/services/Limit.js:29,66`; `manager/src/controllers/Instance.js:19,114`.
- **Evidência:** consulta uso, verifica limites e só depois cria/inicia. Não existe reserva por usuário. Memória/CPU só contam quando o status reportado é `running`; o worker recebe início de forma assíncrona.
- **Reprodução por fluxo:** duas instâncias paradas, cuja soma excede a quota, recebem `/run` antes do primeiro relatório de execução. Ambas consultam o mesmo uso e são admitidas. Criações em workers distintos também podem ultrapassar `maxInstances`.
- **Impacto:** excesso de recursos e instabilidade do host; independente de M04.
- **Correção prevista:** reserva transacional/serialização por usuário e estado de operação pendente, com recuperação em falhas.
- **Contrato/consumidores:** se novos estados forem introduzidos, atualizar modelo, Swagger, relatórios do worker e componentes React.
- **Implementação simplificada (03/10/2026):** criação e checagem de `maxInstances` na mesma transação por proprietário. Início/reinício verificam cota e gravam `status: starting` na mesma transação; `starting` conta memória/CPU. O worker confirma o resultado pelo envio periódico existente de 15 segundos, após tentar iniciar o container, e repete relatórios de falha caso a entrega não ocorra. Reinício não informa a parada intermediária. Modelo, interface e Swagger reconhecem `starting`.
- **Escopo escolhido pelo responsável:** removidos os identificadores de operação, campos adicionais, migração e reconciliação ampla da proposta anterior. Sem relatório do worker, o estado continua `starting` e mantém a cota; não há liberação automática por timeout. Comando não recebido não é recuperado pelo relatório de um runtime inexistente; o boot do worker tenta retomar instâncias `starting`. Relatórios antigos em trânsito não têm identificação de geração.
- **Validação:** 8 testes de criação/início/cotas com SQLite isolado e 4 testes do worker com Docker e temporizadores simulados; regressões de cotas (18), acesso (19), contrato de tipo (20) e exclusão de conta (8) passaram. Testes HTTP de timeout (12), ESLint e Swagger passaram; build da web passou. Não foi usado Docker/MySQL real.

### [x] M06 — P1 — Listagem revela informações de instâncias sem permissão de leitura

- **Local:** `manager/src/services/Instance.js:48`; `manager/src/models/index.js` (`instanceInclude`); rota `GET /instance`.
- **Evidência:** qualquer link inclui a instância na listagem, mesmo com `permissions: []` ou apenas `instance:execute`. Retorna o objeto completo, incluindo `history`, roster, configurações dos jogos e links com e-mail; o GET individual exige `instance:read`. Teste com SQLite isolado: `checkPermission` retornou false, mas `personalRead` retornou a instância com o marcador de histórico privado.
- **Impacto:** usuário sem leitura ou console recebe logs, senhas de jogos que possuem esse campo e informações dos demais compartilhamentos.
- **Correção prevista:** filtrar pela autorização efetiva e/ou retornar projeções compatíveis com as permissões, separando também logs da leitura básica quando aplicável.
- **Contrato/consumidores:** revisar DTOs e Swagger de listagem; testar dashboard, proprietário, administrador e links com permissões mínimas.
- **Regra aprovada pelo responsável:** todo vínculo concede `instance:read` implicitamente, inclusive `permissions: []`; revogar leitura básica exige remover o vínculo. Após ajuste autorizado, a configuração completa de todos os jogos é legível com `instance:read`; sua edição exige `instance:edit`. Histórico exige `instance:console:read`, roster exige `instance:roster:edit` e compartilhamentos exigem proprietário/administrador. A evidência original acima descreve o contrato anterior; a correção passa a limitar os dados acessíveis ao convidado básico.
- **Correção implementada (29/09/2026):** listagem consulta e retorna apenas campos de resumo e identificação pública do worker, sem histórico, jogos, roster ou compartilhamentos. Todas as respostas públicas do controller de instâncias aplicam uma projeção por permissões, incluindo respostas de execução/edição. Leituras diretas de links e roster usam as permissões restritas correspondentes. `instance:read` saiu da lista configurável; permissões efetivas o incluem automaticamente, vínculos antigos continuam válidos e escritas descartam o valor legado. Nenhuma migração de banco é necessária.
- **Integração:** a web remove a opção de leitura, explica o acesso básico implícito e limita abas/controles às permissões. Informações de conexão Minecraft (software/Bedrock) usam `connection`; as configurações completas de todos os jogos são visíveis a leitores, inclusive na aba de configurações em modo somente leitura. Swagger, exemplos e README refletem o contrato. Consultas e comandos internos do worker preservam os dados completos.
- **Validação:** 19 testes em `manager/test/instance-access.test.mjs` passaram com SQLite em memória, serviços/controllers/middleware reais e transporte simulado. Cobrem proprietário, administrador, convidado, estranho, vínculos vazios/legados/removidos, listagem, campos restritos dos quatro jogos, rotas diretas de links/roster e respostas de comandos. Os 18 testes do M04 também passaram; ESLint do código manager alterado, Swagger (41 caminhos, 58 operações) e build da web passaram. Não houve teste com worker/MySQL reais ou navegação manual no navegador.

### [ ] M07 — P1 — Troca de worker não migra arquivos e agenda sua exclusão na origem

- **Local:** `manager/src/services/Instance.js:135`; `worker/src/services/Server.js` (`removeLost`), `worker/src/services/Maintenance.js`.
- **Evidência:** altera somente `workerId`/porta; não copia arquivos, não restaura backup e não verifica a existência dos dados no destino. A manutenção considera a instância perdida na origem e remove sua pasta após cinco dias.
- **Impacto:** em hosts com armazenamento local separado, inicia um mundo novo no destino e posteriormente elimina o anterior. Desassociar com `null` também torna os dados elegíveis à limpeza.
- **Correção prevista:** migração verificável dos dados e conclusão atômica da associação, ou bloquear a operação até haver procedimento explícito de preservação.
- **Contrato/consumidores:** Swagger diz “Moves the instance”; a tela administrativa chama `changeWorker`. Documentar claramente transferência/desassociação e suas garantias.

### [x] M08 — P2 — Renovação de sessão incompatível com o cliente React

- **Local:** `manager/src/controllers/Auth.js` (`refresh`); `web/src/api/client.js:67–80`.
- **Evidência:** manager retorna `{success, user}` e grava cookies; `tryRefresh` só retorna true se existir `data.accessToken`.
- **Impacto:** após expirar o access token, o refresh pode ter sucesso, mas a requisição original não é repetida e a web propaga 401.
- **Correção prevista:** alinhar o cliente à sessão por cookie já documentada; testar acesso após 15 minutos e múltiplas requisições concorrentes.
- **Contrato/consumidores:** a resposta do manager corresponde ao Swagger. O defeito está no consumidor e é registrado aqui como incompatibilidade de integração.
- **Correção implementada:** o cliente web reconhece `success: true` após um refresh HTTP bem-sucedido, sem exigir token no JSON, e repete a requisição original com `credentials: include`. O manager e seu contrato permanecem inalterados.
- **Validação:** oito testes de `web/test/client-refresh.test.mjs` passaram com transporte simulado: sucesso sem token no corpo, preservação de método/corpo/cabeçalhos, erros HTTP/rede/JSON, resposta sem sucesso, ausência de loop após segundo 401 e ausência de refresh desnecessário. Build da web passou. Sem teste de cookies em navegador real. A coordenação de refreshes concorrentes foi implementada posteriormente no M09.

### [x] M09 — P2 — Rotação de refresh e consumo de reset não são atômicos

- **Local:** `manager/src/services/Auth.js:136,227`.
- **Evidência:** lê o hash, verifica e escreve o novo token/senha em etapas separadas, sem compare-and-swap ou transação com bloqueio.
- **Impacto:** refreshes paralelos podem validar o mesmo token e emitir cookies incompatíveis com o último hash persistido; a ordem das respostas pode deixar o navegador com refresh inválido. Dois resets simultâneos também podem consumir o mesmo token e a última senha vence.
- **Correção prevista:** consumo/rotação atômicos e coordenação de refresh no cliente.
- **Contrato/consumidores:** manter o formato documentado de cookies e definir o resultado do token já consumido.
- **Correção implementada (30/09/2026):** refresh e reset usam atualização condicional por usuário, hash apresentado e validade maior que o instante da atualização. A rotação só retorna tokens após alterar exatamente um registro; o reset grava senha e limpa os campos de reset/refresh no mesmo comando. Validade nula/expirada é recusada. Nenhuma migração necessária.
- **Web:** uma Promise compartilhada coordena o refresh na página; requisições com 401 atrasado reutilizam a renovação concluída desde seu envio, com no máximo uma repetição. A Promise é liberada após sucesso ou falha. Abas distintas continuam independentes; o banco garante consumo único também entre elas.
- **Contrato:** cookies e resposta de sucesso preservados. Refresh sem cookie continua 401; token inválido, expirado ou consumido retorna 400, sem emitir ou limpar cookies. Reset inválido/consumido retorna 400 sem alterar a senha. Swagger alinhado; worker não participa. A revogação dos JWTs de acesso foi implementada posteriormente no M10.
- **Validação:** 11 testes em `manager/test/auth-token-consumption.test.mjs` passaram com SQLite em memória, serviços/controller reais, bcrypt real e leituras simultâneas controladas; 12 testes em `web/test/client-refresh.test.mjs` passaram com transporte simulado, incluindo os oito cenários do M08. ESLint dos serviços alterados, Swagger (41 caminhos, 58 operações) e build da web passaram. Sem MySQL real, navegador real ou implantação; os diretórios de testes seguem a configuração local de exclusão do Git.

### [x] M10 — P2 — Reset de senha e logout não revogam access tokens emitidos

- **Local:** `manager/src/services/Auth.js` (`generateAccessToken`, `verifyJWTToken`, `resetPassword`); `manager/src/middlewares/auth.js`; controller de logout.
- **Evidência:** reset limpa refresh e token de reset; logout limpa refresh/cookies. Autenticação continua aceitando qualquer JWT de acesso assinado e não expirado para o usuário existente, sem versão de sessão ou data de revogação. Em SQLite isolado, `verifyJWTToken` aceitou o JWT anterior após `resetPassword` concluir.
- **Impacto:** uma cópia de sessão comprometida permanece utilizável por até 15 minutos após recuperação da conta/logout.
- **Correção prevista:** definir e implementar revogação de sessões, especialmente na troca de senha.
- **Contrato/consumidores:** documentar a política e conferir reautenticação da web; não afirmar que limpar cookies revoga uma cópia do JWT.
- **Correção implementada (30/09/2026):** `user.sessionVersion` começa em zero e entra nos JWTs de acesso. A consulta do usuário feita pelo middleware exige correspondência entre versão do token e do banco; tokens sem versão válida são recusados. Logout incrementa a versão e limpa refresh em uma atualização, revogando todas as sessões anteriores da API. Reset incrementa a versão na mesma atualização condicional que altera a senha e consome o token. O incremento usa expressão no banco para não perder revogações simultâneas. A versão fica excluída das respostas públicas de usuário.
- **Concorrência:** login grava o novo refresh apenas se a versão observada durante a validação da senha ainda for atual; refresh também condiciona sua gravação à versão original. Respostas de login/refresh que chegam após uma revogação só podem carregar a versão antiga, que já não autoriza requisições.
- **Implantação:** executar `npm run db:migrate` em `manager/` para aplicar `20260930120000-add-user-session-version.js` antes de iniciar a nova versão em todos os processos do manager. JWTs antigos sem versão são recusados; um refresh válido pode renovar a sessão. A migração foi testada apenas em banco isolado e não aplicada ao banco do projeto/produção.
- **Validação:** 23 testes de autenticação/token passaram com SQLite em memória, incluindo controller, middleware, bcrypt/JWT reais, revogação, concorrência, campos privados do modelo real e migração/rollback com referências existentes. Passaram também os 19 testes de acesso a instâncias e os 12 testes do cliente de refresh, ESLint dos arquivos manager alterados e validação do Swagger (41 caminhos, 58 operações). Sem MySQL ou navegador reais.
- **Limite explícito:** esta correção revoga access JWTs da API do manager e impede a obtenção de novos tokens de console usando-os. Os tokens de console já emitidos têm ciclo independente no worker (120 segundos para novas conexões); sockets já abertos não são desconectados pelo logout/reset. Revogação própria do console exige alteração adicional no protocolo do worker. Requisições autenticadas antes da revogação também não são canceladas.

### [x] M11 — P2 — Timeout configurado não é aplicado à maioria das chamadas ao worker

- **Local:** `manager/src/utils/proxyFetch.js:4–12`; `manager/src/controllers/Instance.js`; `manager/config/config.js` (`worker.timeout`).
- **Evidência:** o proxy simplesmente chama `fetch(route, options)`. Somente o scheduler passa explicitamente `AbortSignal.timeout`; chamadas de controle e arquivos não o fazem.
- **Impacto:** worker que não responde prende requisições além do prazo configurado e pode acumular conexões. Respostas de controle também não são consumidas/canceladas.
- **Correção prevista:** política de timeout/cancelamento no proxy, diferenciando streaming e controle; liberar corpos de resposta.
- **Contrato/consumidores:** padronizar 503 e evitar que a web repita operações cujo resultado ficou desconhecido.
- **Correção simplificada (03/10/2026):** a pedido do responsável, o proxy usa apenas `AbortSignal.timeout` nas chamadas comuns, mantendo o timeout durante a leitura do corpo JSON. Um sinal externo, quando fornecido, é combinado pelo mecanismo nativo `AbortSignal.any`. `WORKER_TIMEOUT` usa 300000 ms (5 minutos) por padrão, com máximo de 600000 ms (10 minutos). O config apenas lê o valor/conversão e aplica o padrão; a validação fica no `proxyFetch.js`. Falhas de transporte/leitura retornam 503; respostas HTTP e tratamento de JSON inválido/413 permanecem compatíveis.
- **Escopo aprovado:** uploads/downloads preservam o fluxo original de streaming e ficam isentos desse timeout, inclusive durante espera de resposta. Foram removidos o timeout de inatividade, `WORKER_STREAM_IDLE_TIMEOUT`, timers/listeners manuais, acompanhamento de desconexão e recriação de `Response`/`ReadableStream`. Transferências travadas não recebem proteção adicional de inatividade nesta correção.
- **Recursos e consumidores:** início, parada, reinício e backup (manual/agendado) cancelam os corpos que não utilizam. O timeout não desfaz operações já aceitas pelo worker; a web exibe essa orientação e não repete 503 automaticamente, inclusive em uploads XHR. Swagger, README e `.env.example` refletem o escopo simplificado. Nenhuma mudança no worker ou migração de banco.
- **Validação da simplificação:** 12 testes HTTP locais em `manager/test/worker-timeout.test.mjs` passaram: ausência de cabeçalhos, JSON travado/progressivo, streaming além do timeout (inclusive intervalo ocioso), preservação de multipart, sinal externo, descarte de corpos nos comandos/agendador e códigos de erro. Executar com `node --experimental-vm-modules test/worker-timeout.test.mjs` no manager, com permissão para abrir portas em 127.0.0.1. Sem worker/Docker/MySQL reais ou navegador real. A validação da versão anterior com timeout de inatividade foi substituída por estes cenários.

### [x] M12 — P2 — Exclusão de usuário contorna a proteção para instâncias ligadas

- **Local:** `manager/src/services/User.js` (`delete`); `manager/src/controllers/User.js` (`delete`, `deleteOther`); `manager/src/models/index.js:40–46`.
- **Evidência:** apagar usuário destrói instâncias em cascata sem a checagem de `verifyNotRunning` da exclusão direta de instância, nem parada/backup no worker.
- **Impacto:** containers podem seguir executando sem registro no manager até a manutenção; depois são removidos com força e seus dados entram na limpeza. O fluxo de exclusão direta é inconsistente com o da conta.
- **Correção prevista:** orquestrar parada, política de dados e exclusão de forma consistente também para cascatas administrativas.
- **Contrato/consumidores:** revisar endpoints de exclusão de usuário e avisos/erros da web.
- **Escopo aprovado (30/09/2026):** bloquear exclusão se houver instância própria com status persistido `running`, para autoexclusão e exclusão administrativa. O responsável dispensou coordenação com início/reinício concorrente; recuperação de recursos órfãos continua a cargo da manutenção existente no worker. Não há parada nem backup automáticos.
- **Correção implementada:** `User.delete` consulta usuário e instâncias próprias e executa a cascata dentro de uma transação. Se houver instâncias ligadas, retorna 400 com nomes/IDs e não remove registros. Instâncias apenas compartilhadas não bloqueiam a exclusão e permanecem intactas; vínculos do usuário são removidos. Estados `stopped` e `failed` continuam permitidos, como na exclusão individual. Falhas na cascata revertem toda a remoção.
- **Integração:** Swagger das duas rotas documenta 400, propriedade versus compartilhamento, transação e limites. As confirmações da web orientam parar servidores próprios e preservar dados antes de excluir; o tratamento existente exibe os detalhes de erro. Worker preservado: containers órfãos são removidos pela manutenção e arquivos ficam elegíveis à limpeza cinco dias após a marcação como perdidos. Isso não garante uma parada normal nem substitui backup.
- **Validação:** oito testes em `manager/test/user-deletion.test.mjs` passaram com modelos/associações, serviço e controllers reais em SQLite em memória. Cobrem os dois controllers, bloqueio sem alterações, quatro jogos, estados parado/falho, conta sem instâncias, servidor compartilhado ligado preservado, 404 e rollback após falha injetada depois da cascata. Executar com `node --experimental-vm-modules test/user-deletion.test.mjs` no manager. Os 23 testes de autenticação, ESLint do serviço, Swagger (41 caminhos, 58 operações) e build da web também passaram. Sem MySQL, Docker ou navegador reais; testes locais continuam no diretório ignorado pelo Git. Nenhuma migração necessária.
- **Limite explícito:** a decisão usa o status conhecido pelo manager; não serializa exclusão com início/reinício ou transferência de propriedade concorrentes, conforme escopo aprovado.

### [x] M13 — P2 — Tipo declarado na edição não é confrontado com o tipo persistido

- **Local:** `manager/src/schemas/instance.js:34–51`; `manager/src/services/Instance.js:87–99`.
- **Evidência:** `type` informado escolhe o schema Joi e é removido; o serviço aplica `gameData` ao modelo de `instance.type` já salvo. Declarar Minecraft com `difficulty: "normal"` para uma instância Terraria passa no Joi e só falha no modelo numérico.
- **Impacto:** validação usa o jogo errado, propriedades são descartadas silenciosamente ou rejeitadas em outra camada; campos comuns podem ser persistidos apesar do tipo divergente.
- **Correção prevista:** selecionar o schema pelo tipo real, ou exigir igualdade antes de validar. Testar todos os quatro jogos.
- **Contrato/consumidores:** manter compatibilidade com a web que envia `type` e esclarecer no Swagger que o tipo não pode ser alterado.
- **Correção implementada (30/09/2026):** o Joi preserva `type` para que o serviço confronte o valor com o tipo persistido antes de verificar cotas ou gravar qualquer campo. Divergências retornam 400, inclusive sem `game`; o serviço remove `type` das alterações persistidas. A edição continua exigindo ao menos um campo editável, permite campos básicos sem `type` e exige `type` ao enviar `game`.
- **Integração:** a web já envia `instance.type` na edição e permanece compatível. O worker continua recebendo o mesmo tipo e as associações de configuração existentes; não há migração ou mudança de protocolo.
- **Validação:** 20 testes em `manager/test/instance-type-contract.test.mjs` passaram com middleware, controller, serviço e schemas reais, SQLite em memória com modelos de teste e cotas simuladas. Cobrem os quatro jogos, os 12 pares de tipos divergentes (com configuração, sem configuração e com configuração vazia), ausência de gravação em recusas, edição válida e contratos OpenAPI/Joi. Executar com `node --experimental-vm-modules test/instance-type-contract.test.mjs` no manager. Também passaram as suítes de cotas (18 testes) e acesso (19 testes), ESLint dos arquivos de código alterados e Swagger (41 caminhos, 58 operações). Sem MySQL ou worker reais; o diretório `manager/test` permanece ignorado pelo Git conforme configuração existente.

### [x] M14 — P2 — Swagger tem contratos semanticamente incompatíveis com a implementação

- **Local:** `manager/swagger/components/requestBody/instance.json:93,154`; schemas dos jogos; `manager/swagger/paths/auth/refresh.json:4`.
- **Evidência:** `game` usa `oneOf` entre quatro schemas com propriedades opcionais e sem exclusão de propriedades adicionais. `{}` é aceito pelo Joi e pode casar com todos os schemas OpenAPI, violando a exigência de exatamente um. A descrição de edição exige `game` quando há `type`, mas `{name:"hello",type:"minecraft"}` foi aceito no teste. Refresh inválido/expirado lança `InvalidRequest` (400), enquanto a documentação promete 401.
- **Impacto:** validadores/clientes gerados podem rejeitar requisições que o servidor aceita ou tratar respostas incorretamente.
- **Correção prevista:** expressar a relação tipo/configuração sem schemas sobrepostos e alinhar condições/status; validar exemplos reais além da estrutura OpenAPI.
- **Correção implementada (30/09/2026):** criação e edição usam alternativas no objeto completo, com `type` obrigatório e enum de valor único em cada alternativa de jogo. Isso vincula `game` ao schema correto e elimina a sobreposição para `{}`. A edição tem uma alternativa exclusiva para campos básicos sem `type`/`game`; `type` não exige `game`, mas deve coincidir com o jogo persistido. Documentado o descarte de propriedades de jogo desconhecidas já realizado pelo Joi. O Swagger de refresh já estava alinhado a 400 para token inválido/expirado/consumido e 401 para cookie ausente desde M09, e foi conferido.
- **Validação:** os testes de contrato do M13 usam Ajv sobre o Swagger resolvido e Joi para conferir os exemplos de criação/edição, configurações vazias, configurações válidas dos quatro jogos, tipos inválidos, ausência de tipo/configuração e valores inválidos. Exemplos de requisição adicionados ao Swagger. A comparação cobre payloads JSON canônicos; as conversões de strings/números e normalização de caixa feitas pelo Joi não são expressas pelo OpenAPI. Validação estrutural também passou.

### [x] M15 — P1 — Remetente de e-mail é confundido com login SMTP

- **Local:** `manager/src/utils/sendEmail.js:11`; `manager/config/mailer.js`; `manager/config/config.js` (`email.user`).
- **Evidência original:** `EMAIL_USER` era usado tanto em `auth.user` quanto no endereço de `from`, sem configuração separada. O log de produção fornecido pelo responsável mostra `/auth/forgot` falhando com `EENVELOPE`, resposta SMTP `501 Error: Bad sender address syntax`, comando `MAIL FROM`.
- **Condição:** provedores cujo login SMTP não é um endereço de e-mail, ou valores malformados de remetente, produzem envelope inválido. O valor efetivo das variáveis de produção não foi inspecionado; a causa exata do endereço rejeitado ainda precisa ser confirmada.
- **Atualização:** o responsável informou usar Resend. A [documentação SMTP oficial](https://resend.com/docs/send-with-smtp) exige usuário `resend` e API key como senha. Com `EMAIL_USER=resend`, o código anterior montava `"NodeCraft" <resend>`, incompatível com um endereço remetente válido.
- **Impacto:** recuperação de senha e verificação de conta não conseguem enviar mensagens nessa configuração.
- **Correção implementada:** `EMAIL_FROM_ADDRESS` define o remetente, com fallback para `EMAIL_USER` para compatibilidade. Validação Joi rejeita endereço inválido antes do envio e durante `verifyMailer`; o campo `from` usa `{name, address}`. Login SMTP permanece inalterado. README e `.env.example` documentam Resend.
- **Validação:** seis cenários isolados passaram: Resend com remetente separado, fallback antigo, nome com aspas/endereço com espaços externos, login Resend sem remetente, remetente explícito inválido e serviço desabilitado. Transporte local do Nodemailer confirmou envelope e geração dos dois tipos de mensagem, sem conexão SMTP. `npm run docs:validate` passou (41 caminhos, 58 operações).
- **Integração:** payloads de `/auth/forgot` e `/auth/verify` preservados; 503 por configuração inválida já consta no Swagger. Worker não participa do envio e chamadas da web permanecem compatíveis. Nenhum e-mail foi enviado. Implantação e teste com Resend real ainda pendentes: configurar remetente do domínio verificado e reiniciar o manager após publicar a correção.

## Critérios para a futura correção

Manter os IDs acima nas tarefas. Reproduzir cada cenário e conferir manager, worker e web antes de marcar concluído. Vulnerabilidades de arquivos, isolamento de containers e ciclo de vida do runtime estão no [relatório do worker](worker.md), para evitar duplicação.

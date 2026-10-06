# Revisão do worker

Data: 26/09/2026. Base e orientações: [README](README.md). Status: análise concluída; W01 verificado como corrigido localmente em 05/10/2026; demais itens ainda pendentes de verificação/correção.

## Escopo e verificação

Examinados HTTP, autenticação, WebSocket, gerenciamento de arquivos, runtimes dos quatro jogos solicitados, Docker, backups, storage, heartbeat, manutenção e integração com manager/web. Não foram iniciados containers nem usados serviços reais de jogos, S3 ou Docker. As condições de rede e de imagens externas não foram validadas em produção. Não foi feita auditoria de CVEs.

Reproduções isoladas em `/tmp`, sem alterar código, confirmaram: exceções nos três runtimes não Minecraft; passagem de symlink externo pela validação; exceção com payload nulo no console; `finish` recebendo o contexto errado; escrita malsucedida respondendo 201; `STORAGE_ENABLE=false` habilitando backup; ZIP vazio de 22 bytes reportado como sucesso com storage mockado; colisão de diretórios temporários; aceitação de caminho omitido na exclusão. Os demais achados derivam dos fluxos citados.

O contrato público está no Swagger do manager. Não foi localizada uma especificação OpenAPI própria do worker. Ao corrigir rotas internas, conferir também os chamadores no manager e os contratos públicos correspondentes.

## Lista de correções

### [x] W01 — P1 — KSP, Hytale e Terraria não conseguem construir seus runtimes

- **Local:** `worker/src/runtimes/Kerbal.js:9–21`, `Hytale.js:9–21`, `Terraria.js:9–21`; base `Instance.js`.
- **Evidência reproduzida:** os três construtores usam `Path.join(this.instancePath, ...)`, mas a base define `this.path`. Cada construção lançou `The "path" argument must be of type string. Received undefined`.
- **Segundo defeito no mesmo fluxo:** `syncSettings()` chama `this.instance.get({plain:true})`; o manager envia JSON e o worker recebe objeto comum, sem método Sequelize `get`. Corrigir apenas o caminho ainda deixa a configuração quebrada.
- **Impacto:** três dos quatro jogos principais não iniciam por esse fluxo. O HTTP já respondeu sucesso antes da falha.
- **Correção prevista:** alinhar os runtimes à base e ao DTO JSON; testar configuração e partida dos três jogos.
- **Integração:** conferir modelos/schemas de cada jogo no manager, `instance` no Swagger e telas de criação/propriedades.

### [ ] W02 — P1 — Template Hytale referenciado não existe

- **Local:** `worker/src/runtimes/Hytale.js` (`syncSettings`); `worker/src/utils/renderTemplate.js`; `worker/src/templates/`.
- **Evidência:** referência a `hytale/config.json`, mas só existem diretórios `minecraft`, `kerbal` e `terraria`. `readOneFile` devolve string vazia em ENOENT; o renderizador a devolve como template válido. O `.gitignore` global ignora `config.json`.
- **Impacto:** mesmo após W01, a sincronização pode gravar configuração vazia e substituir configuração já existente.
- **Correção prevista:** fornecer template versionado ou serialização estruturada e falhar explicitamente quando faltar um recurso obrigatório; conferir o ignore.
- **Integração:** testar os campos Hytale publicados no Swagger, sem depender de um arquivo local não versionado.
- **Busca histórica em 05/10/2026:** não foi localizado um template Hytale nos commits de todas as referências locais (incluindo `origin/main`, `origin/dev` e `origin/v1`–`v3`), reflogs ou objetos sem referência. A busca também cobriu nomes antigos e conteúdo dos templates. O antigo `src/templates/json/config.json` era configuração da aplicação, não do Hytale. Não foi possível restaurar o template a partir do histórico disponível; W02 permanece pendente.

### [ ] W03 — P1 — Eventos de término não encerram o runtime correto

- **Local:** `worker/src/runtimes/Instance.js:103–107,230–254`; `worker/src/services/Server.js:39`; registro em `worker/src/runtimes/index.js`.
- **Evidência reproduzida:** `stream.once('close', runtime.finish)` invoca `finish` com `this` igual ao stream; o relatório mockado recebeu `id: undefined`. Em `.then(this.finish)`, `this` é indefinido e o método retorna sem limpar nada.
- **Defeitos relacionados:** `delete this` não remove `running[id]`; não fecha a conexão RCON nem altera `this.status`. `Server.stop` chama `finish()` sem aguardar. Rejeição de `container.wait()` não possui catch.
- **Impacto:** timers continuam ativos após saída espontânea do jogo, manager pode continuar vendo `running`, runtimes/recursos ficam retidos e relatórios antigos podem sobrescrever os novos durante reinício.
- **Correção prevista:** callback vinculado à instância, finalização idempotente e aguardada, limpeza explícita de registro/streams/RCON, tratamento de rejeição e ordenação dos relatórios.
- **Integração:** validar saída espontânea, crash, stop e restart observados no manager e na web.

### [ ] W04 — P1 — Links simbólicos escapam da pasta autorizada

- **Local:** `worker/src/middlewares/file.js:14–35`; `worker/src/services/File.js` (`stat`, `readFile`, `writeFile`); controllers de arquivos.
- **Evidência reproduzida:** um `link.txt` dentro da pasta fictícia apontando para um arquivo externo em `/tmp` passou por `verifyPath()` e permitiu ler o marcador externo. A validação só examina o caminho textual; operações seguem symlinks.
- **Pré-condição:** existir symlink no volume da instância, por exemplo criado por plugin/processo do jogo. O atacante não precisa conhecer o segredo do manager para usar depois a API de arquivos com sua permissão normal.
- **Impacto:** leitura/escrita fora da instância, limitada apenas aos privilégios do processo worker; pode atingir outras instâncias ou arquivos de configuração do host. Não foi testada leitura de nenhum segredo real.
- **Correção prevista:** isolamento real da raiz, política explícita de symlinks e proteção contra troca entre validação e uso. Examinar também cópia, ZIP e cálculo recursivo de tamanho.
- **Integração:** manter semântica de caminhos do Swagger e testar symlinks em cada operação.

### [ ] W05 — P1 — RCON usa segredo universal em rede compartilhada

- **Local:** `worker/src/services/Container.js:26,234` e `ensureNetwork`; `worker/src/templates/minecraft/server.properties:40`; `worker/src/runtimes/Instance.js:123`.
- **Evidência de configuração:** todos os containers usam `nodecraft-net`; todos os Minecraft recebem `RCON_PASSWORD=nodecraft` e `rcon.password=nodecraft`. O projeto não configura isolamento entre instâncias nessa rede.
- **Cenário:** em implantação sem bloqueio externo de tráfego lateral, código de plugin controlado por um usuário em seu container pode alcançar RCON de outro container e usar a senha conhecida. Não é necessário publicar RCON no host para esse cenário interno. A conectividade não foi testada nesta revisão.
- **Impacto:** comandos administrativos em instâncias de outros usuários, contornando permissões do manager.
- **Correção prevista:** segredo aleatório por instância e isolamento de rede, preservando somente o acesso necessário do worker.
- **Integração:** ajustar conexão RCON e backup de configurações; não expor o segredo em DTOs públicos.

### [ ] W06 — P1 — Payload malformado no console lança exceção sem tratamento

- **Local:** `worker/src/websocket/events.js:5,17`.
- **Evidência reproduzida:** ambos os handlers desestruturam o argumento imediatamente. Chamá-los com `null` lançou `Cannot destructure property 'instanceId' ...` antes de qualquer teste de permissão.
- **Impacto:** cliente autenticado no socket, inclusive apenas com leitura, pode acionar exceção não capturada no handler e derrubar o worker se não houver tratamento externo; afeta todas as instâncias geridas por esse processo.
- **Correção prevista:** validar objeto, IDs, comando, tipos e limites antes de desestruturar; encapsular falhas e responder erro do protocolo.
- **Integração:** testar o consumidor de console React com eventos ausentes/nulos e comandos inválidos.

### [ ] W07 — P2 — Autorização de console continua válida após expiração/revogação

- **Local:** `worker/src/websocket/auth.js:10`; `worker/src/websocket/events.js`; `manager/src/controllers/Instance.js` (`consoleToken`).
- **Evidência:** JWT de 120 segundos é validado apenas no handshake; nenhum timer ou evento revalida a sessão. As permissões ficam copiadas no socket.
- **Impacto:** conexão já aberta pode continuar lendo e enviando comandos após expirar o JWT, remover o link, alterar permissões ou deslogar no manager.
- **Correção prevista:** definir validade da sessão de console e mecanismo de expiração/revogação, com reconexão autorizada.
- **Integração:** conferir Swagger do token e reconexão na web; não desconectar sem oferecer renovação compatível.

### [ ] W08 — P1 — Operações de ciclo de vida concorrem sem exclusão por instância

- **Local:** `worker/src/controllers/Server.js`; `worker/src/services/Server.js:17–92`; construtores dos runtimes.
- **Evidência:** controllers disparam operações sem aguardar; `run` não possui trava; `new Runtime()` dispara `setup()` sem expor sua conclusão. O Set `backingUp` só bloqueia outro backup, não run/stop/restart.
- **Cenários:** dois starts antes de criar o container podem colidir; o tratamento de erro chama stop e pode parar o start concorrente que deu certo. Run/restart durante backup pode modificar arquivos enquanto o ZIP é criado. Backup decide parar/religar pelo snapshot `instance.status`, sem consultar o estado real.
- **Impacto:** parada inesperada, configurações regravadas com jogo ativo e backup inconsistente. `Server.run()` terminar sua Promise não significa que o setup terminou.
- **Correção prevista:** fila/trava por instância e operação aguardável até uma etapa bem definida; serializar backup com controles e verificar estado real.
- **Integração:** o Swagger admite fire-and-forget; preservar aceitação assíncrona exige status/resultado confiáveis, não apenas resposta HTTP 200.

### [ ] W09 — P2 — Instância é reportada ligada antes de o Docker iniciar

- **Local:** `worker/src/runtimes/Instance.js:214–227`; `worker/src/services/Container.js` (`run`, `stop`, `delete`).
- **Evidência:** `start` marca `running`, envia relatório e cria timer antes de chamar `Container.run`. Esse método captura falhas e retorna normalmente, inclusive quando não encontra container.
- **Impacto:** se Docker recusar o start, o painel pode continuar mostrando servidor ligado; recursos permanecem contabilizados e operações ficam bloqueadas pelo manager. Falhas de stop também não são propagadas ao backup.
- **Correção prevista:** confirmar sucesso/estado do Docker e comunicar erro terminal; usar estado de inicialização caso necessário.
- **Integração:** conferir `status` e histórico no Swagger, modelos e componentes da web.

### [ ] W10 — P1 — Escritas e descompactação não respeitam quota de disco

- **Local:** `worker/src/middlewares/uploader.js`; `worker/src/services/File.js` (`copy`, `unzip`); `manager/src/services/Limit.js`; `worker/src/runtimes/Instance.js` (`measureDiskUsage`).
- **Evidência:** Multer não tem limite de tamanho; cópias e extrações não limitam bytes expandidos; cotas do manager são checadas apenas ao criar/iniciar, não nas rotas de arquivos. Pastas de instâncias paradas não são medidas periodicamente por um runtime ativo.
- **Cenário:** usuário autorizado duplica repetidamente um arquivo já existente ou extrai ZIP com expansão elevada. Isso independe do upload quebrado registrado em M03; quando ele for corrigido, também permitirá arquivos sem limite.
- **Impacto:** esgotamento do disco compartilhado e indisponibilidade dos demais servidores. Crescimento de arquivos pelo próprio jogo também não é limitado pelo Docker configurado.
- **Correção prevista:** quota efetiva no armazenamento, limites de upload/extração e medição de instâncias paradas; considerar espaço temporário e concorrência.
- **Integração:** combinar limites e respostas 413/403 entre proxy, worker, Swagger e web.

### [ ] W11 — P2 — Falhas de arquivos são convertidas em sucesso

- **Local:** `worker/src/services/File.js:121` e métodos de mkdir/copy/move/delete/read; `worker/src/controllers/File.js`.
- **Evidência reproduzida:** com `createOneFile` retornando false, `Controller.create` respondeu 201 e `{success:true}`. Controllers não conferem retornos; os serviços engolem erros de I/O.
- **Impacto:** disco cheio, permissão negada e falhas de movimentação podem ser apresentados como sucesso. O renderizador também trata falha de leitura como conteúdo vazio.
- **Correção prevista:** propagar erros tipados de I/O e confirmar resultados antes de responder ou continuar setup/backup.
- **Integração:** revisar erros JSON documentados e mensagens do gerenciador de arquivos React.

### [ ] W12 — P1 — Backup vazio é marcado como sucesso e pode substituir retenção útil

- **Local:** `worker/src/services/File.js:201–225,276`; `worker/src/services/Backup.js:77–115`.
- **Evidência reproduzida:** executar backup de instância fictícia sem pasta gerou ZIP de **22 bytes**; uploads simulados receberam esse ZIP e `Backup.execute` retornou `status:success`. Caminhos ausentes são ignorados por `makeZip`.
- **Impacto:** falsa proteção dos dados; backups inválidos sucessivos entram na retenção e podem levar à exclusão de cópias anteriores válidas.
- **Correção prevista:** distinguir arquivos opcionais de dados obrigatórios, validar conteúdo/consistência do backup antes de upload e só então aplicar retenção.
- **Integração:** relatório de backup ao manager deve refletir falha/ausência de dados; conferir Swagger e tela de backups.

### [ ] W13 — P2 — Backups/downloads simultâneos compartilham caminhos temporários

- **Local:** `worker/src/services/File.js:113–117,304–306`; `worker/src/controllers/File.js` (`read`).
- **Evidência reproduzida:** duas chamadas com o mesmo milissegundo retornaram o mesmo diretório. Nome de arquivo também é baseado somente em `Date.now()`.
- **Impacto:** operações simultâneas podem truncar/substituir/remover o ZIP umas das outras. Em downloads ou backups de instâncias diferentes, a colisão também pode misturar/expor dados entre instâncias.
- **Correção prevista:** diretório exclusivo por operação (`mkdtemp`/identificador aleatório) e ciclo de limpeza associado à conclusão; a limpeza por idade não deve apagar operação ainda ativa.
- **Integração:** testar concorrência e downloads/uploads lentos sem alterar nomes públicos desnecessariamente.

### [ ] W14 — P2 — STORAGE_ENABLE=false habilita o fluxo de backup

- **Local:** `worker/config/config.js:30`; `worker/src/services/Backup.js:70`.
- **Evidência reproduzida:** configuração mantém string de ambiente; a string `"false"` é truthy. `Backup.skipReason({type:'minecraft'})` retornou null com `STORAGE_ENABLE=false`.
- **Impacto:** backup que deveria ser ignorado pode parar/reiniciar servidor e tentar acessar storage não configurado.
- **Correção prevista:** conversão explícita para booleano e validação das configurações quando habilitado.
- **Integração:** testar resultados `skipped`/`failed`/`success` esperados pelo manager.

### [ ] W15 — P2 — STORAGE_MAX não é aplicado

- **Local:** `worker/src/services/Backup.js:11,77`; `worker/src/providers/Storage.js` (`getStorageUsage`); `README.md:253`.
- **Evidência:** existe `verifyAvailableSpace`, mas não é chamada pelo fluxo de backup; `backupSize` calculado por `makeBackup` é descartado por `execute`.
- **Impacto:** continua enviando cópias acima do limite configurado, contrariando a documentação e podendo aumentar custo/causar falhas de storage. Cópias diária e semanal precisam ser contabilizadas.
- **Correção prevista:** definir e aplicar o limite, tratando uploads simultâneos e resultado de falha sem perder cópias válidas.
- **Integração:** manter resultado de backup coerente e atualizar documentação se a política mudar.

### [ ] W16 — P1 — Alterações/revogação do roster não chegam ao jogo em execução

- **Local:** `worker/src/runtimes/Minecraft.js:135–145`; `manager/src/controllers/Roster.js`; `manager/src/services/Roster.js`.
- **Evidência:** `this.rosters` recebe o snapshot inicial; não existe atualização posterior do roster no worker. CRUD no manager altera somente banco. `makeBarrier()` reutiliza o snapshot e só gera lista de operadores quando `makeOplist` é true, no setup.
- **Impacto:** remover jogador ou `privileged` no painel não revoga sua autorização/privilégio até reiniciar; novos jogadores também não entram na lista do servidor em execução.
- **Correção prevista:** sincronização versionada do roster e aplicação efetiva de concessões/revogações, inclusive operadores e conexões existentes conforme política.
- **Integração:** Swagger de DELETE afirma revogação. Conferir painel de jogadores, manager e arquivos/comandos do jogo. KSP/Hytale também não possuem consumo do roster, embora o manager aceite plataformas pelo fallback de configuração.

### [ ] W17 — P2 — Minecraft muda de versão implicitamente ao recriar container

- **Local:** `worker/src/services/Container.js:10–31`; `worker/src/services/Server.js` (`stop`, `restart`).
- **Evidência:** cada criação consulta `manifest.latest.release` e usa essa versão; stop remove o container. Não há versão persistida por instância nem opção de manter a instalada.
- **Impacto:** reinício após lançamento externo pode atualizar o servidor/mundo e quebrar plugins/clientes sem escolha do usuário. Uma indisponibilidade da API externa impede criar container mesmo havendo arquivos locais. A consulta também não tem timeout explícito.
- **Correção prevista:** persistir versão e tratar atualização como operação explícita com backup e política de recuperação; limitar consulta externa.
- **Integração:** novo campo requer alinhamento de schema, modelo, Swagger, worker e formulários React. Não foi avaliada compatibilidade de nenhuma versão externa específica.

### [ ] W18 — P2 — Valores livres são inseridos sem escape nos arquivos de configuração

- **Local:** `worker/src/utils/renderTemplate.js`; `worker/src/runtimes/Minecraft.js` (`sync`); schemas dos jogos em `manager/src/schemas/`.
- **Evidência:** substituição textual direta; `Joi.string().trim()` não proíbe quebras de linha internas em `motd`, senha ou nome de servidor. Texto vira novas diretivas em `.properties`/`.txt`; valores com padrões de substituição como `$&` também não são inseridos literalmente por `String.replace`.
- **Impacto:** configuração aplicada diverge da aprovada no modelo. Por exemplo, o template Terraria termina em `motd`, permitindo que nova linha injete outra diretiva de senha quando seu runtime for corrigido.
- **Correção prevista:** serialização/escape específico do formato e restrição de caracteres por campo; JSON deve ser serializado como JSON.
- **Integração:** alinhar validações da web/Joi/Swagger. Não há evidência aqui de execução de comandos de shell; o achado é injeção de configuração.

### [ ] W19 — P2 — Logs podem bloquear permanentemente relatórios de estado

- **Local:** `worker/src/runtimes/Instance.js:59–80,186–205`; `manager/src/routes/index.js` (`express.json`).
- **Evidência:** histórico limita quantidade de linhas somente após falha, não bytes por linha; buffer de linha incompleta não tem teto. O manager limita JSON a 100 kB.
- **Cenário:** uma linha acima do limite permanece nas últimas 200 linhas; o worker continua mandando o mesmo lote, recebe 413 e nunca o remove enquanto não houver linhas suficientes para expulsá-la.
- **Impacto:** estado/disco param de sincronizar. Saída sem newline ou muito intensa também pode fazer a memória crescer sem limite entre envios.
- **Correção prevista:** limites por bytes/linha, truncamento e envio em lotes, garantindo que erro de um log não impeça relatório de estado.
- **Integração:** conferir limite publicado no Swagger e histórico/console na web.

### [ ] W20 — P1 — Excluir arquivo sem path remove a raiz da instância

- **Local:** `manager/src/controllers/File.js` (`delete`); `worker/src/middlewares/file.js:42`; `worker/src/controllers/File.js` (`delete`); `worker/src/services/File.js` (`delete`).
- **Evidência reproduzida parcialmente:** ausência de `path` foi aceita por `verifyPath()`. O manager converte ausência para string vazia; o worker resolve isso para a pasta da instância e chama remoção recursiva com force. Nenhuma pasta real foi excluída no teste.
- **Impacto:** uma requisição incompleta, que deveria ser inválida segundo o parâmetro obrigatório do Swagger, pode apagar todos os dados da instância, inclusive com servidor ligado.
- **Correção prevista:** validar query antes do proxy e no worker, rejeitar raiz como alvo de operações destrutivas e separar eventual operação explícita de limpeza total.
- **Integração:** testar omissão, vazio, `/` e `.`; conferir contrato de exclusão e confirmação da web.

## Retomada e limites

W01 foi verificado como corrigido localmente em 05/10/2026, com os limites registrados no item. Os demais achados permanecem pendentes de verificação/correção. Corrigir primeiro inicialização dos jogos, isolamento/autorização e preservação de dados. Os problemas do proxy, cotas no manager e migração entre workers estão no [relatório do manager](manager.md). Validar as futuras correções em ambiente descartável com Docker e storage de teste antes de publicar.

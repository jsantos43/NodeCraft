# Revisão do worker

06/10/2026 — Pendências confirmadas por leitura de fluxo e reproduções isoladas com dependências simuladas; sem Docker, banco ou storage reais. Os problemas de backup W22–W25 foram acrescentados em 07/10/2026 por revisão de código, sem executar um backup real.

## W04 — Limite da proteção simples contra links simbólicos

Implementado em 06/10/2026: o middleware usa `verifyNoSymlinks()` para rejeitar links em cada componente de `path` e `destiny`, inclusive links quebrados, links internos e pastas anteriores à raiz da instância. W20 também foi corrigido: exclusão e movimentação da raiz são bloqueadas, mantendo sua leitura permitida.

**Limite conhecido:** a verificação com `lstat()` acontece antes da operação. Um processo malicioso com escrita na pasta ainda pode substituir um componente por link nesse intervalo. A solução simples aprovada não fornece isolamento contra essa corrida.

Validação: sete cenários automatizados com arquivos temporários reais, sem Docker ou storage, cobrindo links, caminhos inválidos, proteção da raiz e operações comuns.

## W07 — Revogar acesso não encerra o controle pelo console

**Local:** `worker/src/websocket/auth.js:10`; `worker/src/websocket/events.js`.

O JWT e as permissões são verificados somente na conexão. Quem já abriu o console com permissão de escrita continua enviando comandos após a remoção do vínculo, a revogação da permissão ou a expiração do token. A revogação de sessões da API não invalida esse socket.

## W08 — Iniciar durante backup permite copiar um mundo em alteração

**Local:** `worker/src/services/Server.js:17,70`; `manager/src/routes/instance.js`.

O conjunto `backingUp` bloqueia apenas outro backup. Após pedir backup de uma instância parada, o usuário pode chamar `/run` enquanto o ZIP ainda é criado; não há trava compartilhada entre essas operações. O jogo pode modificar o mundo durante a cópia, produzindo backup inconsistente marcado como sucesso. O setup já é aguardado no código atual; essa parte do relato antigo foi removida.

## W10 — Operações de arquivos podem esgotar o disco compartilhado

**Local:** `worker/src/middlewares/uploader.js`; `worker/src/services/File.js` (`copy`, `unzip`); `manager/src/routes/file.js`.

Upload não limita tamanho, e cópia/descompactação não limitam os bytes gravados nem consultam a cota. Um usuário com escrita de arquivos pode enviar arquivos grandes ou expandir/copiar conteúdo repetidamente, inclusive com a instância parada, até comprometer o armazenamento dos demais servidores. A correção do proxy de upload não elimina esse problema.

## W12 — Backup sem dados substitui cópias úteis na retenção

**Local:** `worker/src/services/File.js:237-284,311-348`; `worker/src/services/Backup.js:77-106`.

`makeZip()` ignora caminhos ausentes, e o backup não exige a presença dos dados do mundo. Uma pasta perdida ou vazia pode gerar ZIP vazio ou apenas de configuração, enviado como sucesso. A retenção roda em seguida; backups inválidos sucessivos podem eliminar as últimas cópias recuperáveis.

## W21 — Hytale não recebe imagem nem volumes ao criar o container (novo)

**Local:** `worker/src/services/Container.js:141,208`.

`defineHytale()` é assíncrona, mas `create()` a chama sem `await`. Assim, `info` é uma Promise e `Image`, volumes e portas ficam indefinidos na chamada ao Docker, impedindo a criação normal do servidor. Confirmado com o método real e Docker simulado.

Há ainda a pendência W02: `worker/src/runtimes/Hytale.js` pede `hytale/config.json`, inexistente em `worker/src/templates`. Mesmo corrigida a criação do container, a configuração do painel não será gerada corretamente.

## W22 — Falha ao parar o container permite backup de arquivos em alteração (P1)

**Local:** `worker/src/services/Container.js:299-319`; `worker/src/services/Server.js:47-59,89-101`.

`Container.stop()` captura e apenas registra até a falha do SIGKILL; `Server.stop()` também captura erros e não informa ao chamador se o container realmente parou. `Server.backup()` prossegue para `Backup.execute()` após `await Server.stop()`. Assim, uma falha no Docker pode gerar um ZIP de mundo ainda em alteração e reportar `success`. É preciso confirmar a parada antes de copiar os dados e reportar `failed` quando ela não ocorrer.

## W23 — Resultado do backup pode se perder sem nova tentativa (P1)

**Local:** `worker/src/services/Manager.js:66-75`; `worker/src/services/Server.js:99-103`; `manager/src/services/Instance.js:207-215`.

`reportBackupResult()` cancela o corpo da resposta, mas não verifica `response.ok`; um 401 ou 500 é tratado como entrega bem-sucedida. Erros de rede são apenas registrados, sem retry. O worker pode concluir a cópia e o manager ficar sem o resultado, deixando o estado pendente no painel. A entrega precisa verificar o status HTTP e repetir falhas transitórias de forma limitada.

## W24 — Limpeza periódica pode remover um ZIP de backup ativo (P1)

**Local:** `worker/src/services/File.js:25,149-155,212-230,340-348`; `worker/src/services/Maintenance.js:54-60`; `worker/src/services/Backup.js:84-95`.

Cada backup usa uma pasta temporária nomeada pelo horário de criação. `removeOldTemp()` remove qualquer pasta com 15 minutos ou mais, e a manutenção o executa a cada 15 minutos sem verificar se a pasta está em uso. Se compactação e envio demorarem mais que esse prazo, o ZIP pode ser removido durante a operação, fazendo o backup falhar.

## W25 — Listagem parcial do storage prejudica a retenção e a seleção de backups (P2)

**Local:** `worker/src/providers/Storage.js:12-18,72-81`; `worker/src/services/Backup.js:18-43`.

`Storage.list()` usa uma única chamada `ListObjectsV2`, sem percorrer `NextContinuationToken`, e retorna no máximo a primeira página. `verifyNeeds()` ainda considera `dailyBackups[0]` como o backup mais recente, embora a listagem não seja ordenada por data. Com muitos objetos, backups recentes podem não ser vistos, cópias semanais desnecessárias podem ser criadas e `prune()` pode deixar objetos antigos fora da primeira página indefinidamente. É necessário percorrer todas as páginas e selecionar pela data de modificação.

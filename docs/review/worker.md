# Revisão do worker

06/10/2026 — Apenas pendências de alta gravidade (P1). Itens corrigidos e de menor impacto removidos. Validação por leitura de fluxo e reproduções isoladas com dependências simuladas; sem Docker, banco ou storage reais.

## W04 — Links simbólicos permitem acessar arquivos fora da instância

**Local:** `worker/src/middlewares/file.js:14`; `worker/src/services/File.js` (`getType`, `readOneFile`, `createOneFile`).

A validação confere o caminho textual, mas não resolve links simbólicos. Se um plugin/processo do jogo criar um link na pasta montada, uma requisição de arquivo pode seguir esse link no host e ler ou sobrescrever arquivos externos que o usuário do worker consiga acessar, inclusive de outras instâncias. Não exige `..` no caminho enviado.

## W05 — RCON permite controlar outras instâncias na rede compartilhada

**Local:** `worker/src/services/Container.js:26,234`; `worker/src/templates/minecraft/server.properties:40`.

Todos os containers usam `nodecraft-net` e os servidores Minecraft compartilham a senha RCON `nodecraft`. Código executado em uma instância, por exemplo por plugin instalado pelo usuário, pode conectar ao RCON das demais e executar comandos administrativos sem autorização do manager.

## W06 — Mensagem inválida no console pode derrubar o worker

**Local:** `worker/src/websocket/events.js:5,17`.

Os handlers desestruturam o payload sem validar nem capturar exceções. Um cliente autenticado no console pode emitir `join-console` com `null` ou `send-command` sem argumento, provocando `TypeError` antes da checagem de permissões. A exceção não tratada ameaça todo o processo do worker. Exceção confirmada chamando os handlers reais com sockets simulados.

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

**Local:** `worker/src/services/File.js:201,276`; `worker/src/services/Backup.js` (`execute`, `cleanup`).

`makeZip()` ignora caminhos ausentes, e o backup não exige a presença dos dados do mundo. Uma pasta perdida ou vazia pode gerar ZIP vazio ou apenas de configuração, enviado como sucesso. A retenção roda em seguida; backups inválidos sucessivos podem eliminar as últimas cópias recuperáveis.

## W16 — Remover jogador ou privilégio não revoga acesso no jogo ligado

**Local:** `worker/src/runtimes/Minecraft.js:138,150`; `manager/src/services/Roster.js` (`update`, `delete`).

O runtime mantém o roster recebido no início. Alterações no manager mudam apenas o banco, sem atualizar o worker; a lista de operadores é gerada somente no setup. Um jogador removido ou rebaixado no painel mantém a autorização/privilégio no servidor até reiniciá-lo.

## W20 — Exclusão sem caminho apaga a pasta inteira da instância

**Local:** `manager/src/controllers/File.js` (`delete`); `worker/src/middlewares/file.js:42`; `worker/src/controllers/File.js:107`.

O manager converte `path` ausente em vazio. O worker aceita esse valor e resolve o alvo para a raiz da instância, chamando remoção recursiva inclusive com o jogo ligado. Uma requisição incompleta pode apagar todo o mundo. Reprodução isolada confirmou o caminho entregue à remoção; nenhum arquivo real foi excluído.

## W21 — Hytale não recebe imagem nem volumes ao criar o container (novo)

**Local:** `worker/src/services/Container.js:141,208`.

`defineHytale()` é assíncrona, mas `create()` a chama sem `await`. Assim, `info` é uma Promise e `Image`, volumes e portas ficam indefinidos na chamada ao Docker, impedindo a criação normal do servidor. Confirmado com o método real e Docker simulado.

Há ainda a pendência W02: `worker/src/runtimes/Hytale.js` pede `hytale/config.json`, inexistente em `worker/src/templates`. Mesmo corrigida a criação do container, a configuração do painel não será gerada corretamente.

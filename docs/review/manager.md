# Revisão do manager

06/10/2026 — Apenas pendências de alta gravidade (P1). Código atual revisado; itens corrigidos e de menor impacto removidos. Sem alterações no código.

## M07 — Troca de worker pode apagar os dados da instância

**Local:** `manager/src/services/Instance.js:166`; `worker/src/services/Server.js:126`.

`changeWorker()` altera somente o vínculo no banco, sem copiar os arquivos. Ao iniciar no destino, a instância usa uma pasta nova. A manutenção da origem considera a pasta abandonada e a exclui após cinco dias. Uma troca administrativa normal pode, portanto, perder o mundo original. Confirmado por leitura do fluxo.

## M16 — Edição simultânea ao início permite burlar a cota de recursos (novo)

**Local:** `manager/src/middlewares/instance.js:4`; `manager/src/services/Instance.js:90,110`; `manager/src/services/Limit.js` (`readUsage`).

A edição verifica se a instância está parada antes da transação, mas não verifica novamente nem usa a trava de `markStarting()`. Uma edição que passou pela verificação pode reduzir a memória/CPU no banco depois de um `/run` enviar a configuração maior ao worker. O container conserva os recursos originais, enquanto a cota passa a contabilizar os valores menores, permitindo iniciar outros servidores acima do limite.

Reprodução isolada confirmou que a edição grava mesmo após o estado mudar para `starting`; a sequência completa com Docker/MySQL foi analisada pelo fluxo, não executada.

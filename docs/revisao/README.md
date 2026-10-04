# Revisão técnica — NodeCraft

Data: 26/09/2026. Base: `baa404e34eddbfcba42e8ac94efba69c440f9749`.

## Orientações permanentes solicitadas pelo responsável

- O projeto gerencia servidores de Minecraft, Hytale, KSP (`kerbal`) e Terraria e é dividido em manager, worker e web app React.
- Ao criar ou alterar uma rota, requisição, resposta ou seu formato, conferir o Swagger em `manager/swagger/openapi.json` e seus arquivos referenciados.
- Conferir o efeito de cada alteração sobre os três componentes: manager, worker e web app. Validar o Swagger estruturalmente não comprova compatibilidade com consumidores.
- Nesta etapa, somente documentar vulnerabilidades, erros e bugs em Markdown. Não corrigir código.
- Manter relatórios separados e pontos de retomada: primeiro manager, depois worker.

Este arquivo registra a orientação no próprio repositório para consultas futuras; não pressupõe memória externa à conversa.

## Relatórios e retomada

1. [Manager](manager.md): revisão concluída no escopo descrito no relatório.
2. [Worker](worker.md): revisão concluída no escopo descrito no relatório.

A web app foi consultada como consumidora dos contratos, mas não recebeu uma revisão completa independente. Após a revisão, o responsável autorizou corrigir o envio de e-mail, as verificações de cota do M04 e o acesso a dados do M06 com leitura básica implícita por vínculo: M15, M04, M06, o cliente web do M08 o consumo de tokens do M09 a revogação de sessões da API do M10 o M11 (timeout nativo em chamadas comuns e descarte das respostas; simplificado em 03/10/2026), o M12 (bloqueio de exclusão de conta com instâncias próprias ligadas e cascata transacional) e os itens M13/M14 (tipo imutável na edição e contrato Swagger) foram corrigidos localmente; implantação ainda pendente. M05 recebeu a solução simplificada autorizada em 03/10/2026: criação atômica e status `starting` contado nas cotas, confirmado pelo relatório periódico do worker. O estado dos demais itens consta dos relatórios. Uma revisão não garante ausência de outros problemas.

Prioridades: **P1** = corrigir antes da publicação (segurança, perda de dados ou funcionalidade principal quebrada); **P2** = problema relevante de confiabilidade/contrato; **P3** = impacto menor. As reproduções usaram dados fictícios, mocks ou arquivos temporários em `/tmp`; nenhum servidor de jogo, banco real ou bucket foi modificado.

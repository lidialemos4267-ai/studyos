# Extensão StudyOS — TEC Concursos

Guarda no **seu navegador** as questões que você resolve no TEC Concursos: enunciado, alternativas, sua resposta, gabarito, comentário do professor, matéria, assunto, banca, estatística (quando disponível) e os totais do caderno. Depois entrega tudo ao seu StudyOS.

- **Só lê o que aparece na sua tela.** Não responde questões, não clica em nada, não baixa questões em lote e não envia nada para nenhum servidor.
- **Permissões mínimas:** `storage` e acesso a `https://www.tecconcursos.com.br/*`.
- **Uso pessoal**, com a sua própria conta. Confira os termos de uso do TEC antes de compartilhar a extensão com outras pessoas.

## Instalação (primeira vez)

1. Baixe o repositório: no GitHub, clique em **Code › Download ZIP** e **extraia** o arquivo (botão direito › *Extrair tudo…*).
2. No Chrome, digite `chrome://extensions` na barra de endereço.
3. Ligue o **Modo do desenvolvedor**, no canto superior direito.
4. Clique em **Carregar sem compactação** e escolha a pasta **`extensao-tec`** (a que contém o `manifest.json`).
5. Clique no ícone de quebra-cabeça da barra do Chrome e **fixe** "StudyOS — TEC".
6. **Só se você abre o StudyOS como arquivo no computador** (endereço começando com `C:/...`): em `chrome://extensions`, clique em **Detalhes** da extensão e ligue **Permitir acesso a URLs de arquivo**. Pelo link do GitHub Pages, não precisa.

Não apague nem mova a pasta `extensao-tec` depois de instalar: o Chrome carrega a extensão a partir dela.

## Como usar

1. Abra o TEC e resolva normalmente.
2. Quando você errar, aparece no canto da tela **"✗ Erro guardado (N no total)"**. Se for a segunda vez na mesma questão, aparece **"⚠ Errada N vezes!"**. Acertos mostram **"✓ Acerto registrado"**.
3. Clique em **"Ver resolução"** no TEC para que o comentário do professor também seja guardado. Ele é acrescentado depois, sem contar um novo erro.
4. Abra o StudyOS em **Banco de questões (TEC)**. Com a extensão instalada, os dados chegam **sozinhos**, e aparece "● Extensão conectada".

### Regras de contagem

- Uma tentativa só conta se a questão ficou aberta **sem resposta por pelo menos 2 segundos** e depois foi resolvida.
- Reabrir uma questão já resolvida **não** conta de novo.
- O comentário, a matéria e as outras informações já guardadas nunca são apagadas por uma leitura incompleta.

## Popup (ícone da extensão)

- **Contagens:** questões guardadas, com erro, erradas 2 vezes ou mais, e cadernos acompanhados.
- **Baixar JSON** e **Copiar JSON:** para fazer backup, ou para importar no StudyOS em outro aparelho (*Banco de questões › Importar / extensão*).
- **Diagnóstico:** abra uma questão no TEC e clique. O relatório é copiado automaticamente. **Se algo parar de funcionar** (o TEC muda a página de vez em quando), cole esse relatório na conversa com o Claude para ajustar os seletores.
- **Limpar:** pede dois cliques. Apaga só os dados da extensão; o StudyOS mantém o que já recebeu.

## Como testar na primeira vez

1. No TEC, abra uma questão, espere 3 segundos e **erre de propósito**. Deve aparecer o aviso vermelho.
2. Clique em "Ver resolução".
3. Abra o popup: "com erro" deve mostrar 1.
4. Clique em **Diagnóstico** e confira:
   - `angular.vmEncontrado: true`;
   - os seletores `errou`, `enunciado` e `alternativas` com contagem maior que 0;
   - `questaoLida` com seus dados.
5. Abra o StudyOS em *Banco de questões*: a questão deve estar lá, e o erro deve estar também no **Caderno de Erros**.

Se o aviso não aparecer ou o diagnóstico mostrar contagens zeradas, mande o relatório do diagnóstico. Os seletores desta versão foram testados numa página que **imita** a estrutura descrita do TEC, não no site real.

## Atualizar a extensão

Baixe a versão nova, substitua a pasta `extensao-tec` e clique em **↻ (recarregar)** no cartão da extensão, em `chrome://extensions`. Os dados guardados continuam lá.

# Fluxos de teste comuns

Receitas prontas para os cenários de QA mais frequentes.

---

## Verificar deploy em produção

Use após cada deploy para confirmar que o site está de pé.

```
1. browser_navigate("https://seusite.com")
2. browser_take_screenshot()               # evidência do estado inicial
3. browser_console_messages()              # erros JS?
4. browser_network_requests()              # APIs retornando erro?
5. browser_snapshot()                      # elementos principais visíveis?
6. Navegar para 2-3 páginas críticas e repetir steps 2-4
7. browser_resize(375, 812)               # checar mobile
8. browser_take_screenshot()
```

Critério de aprovação: sem erros críticos no console, principais páginas carregam, mobile funciona.

---

## Testar formulário de login

```
1. browser_navigate("https://seusite.com/login")
2. browser_snapshot()                      # identificar campos
3. browser_take_screenshot()               # estado inicial

# Caminho feliz
4. browser_fill_form({email: "$TEST_EMAIL", senha: "$TEST_PASSWORD"})
5. browser_click(ref_botao_entrar)
6. browser_take_screenshot()               # redirecionou para dashboard?
7. browser_console_messages()

# Caminho de erro — email inválido
8. browser_navigate("https://seusite.com/login")
9. browser_fill_form({email: "emailinvalido", senha: "qualquer"})
10. browser_click(ref_botao_entrar)
11. browser_take_screenshot()              # mensagem de erro apareceu?

# Caminho de erro — senha errada
12. browser_navigate("https://seusite.com/login")
13. browser_fill_form({email: "$TEST_EMAIL", senha: "senhaerrada"})
14. browser_click(ref_botao_entrar)
15. browser_take_screenshot()              # mensagem de erro apareceu?

# Campos obrigatórios
16. browser_navigate("https://seusite.com/login")
17. browser_click(ref_botao_entrar)        # sem preencher nada
18. browser_take_screenshot()              # validação apareceu?
```

**Nunca use credenciais reais.** Defina variáveis de teste:
```bash
export TEST_EMAIL="qa@exemplo.com"
export TEST_PASSWORD="SenhaSegura123!"
```

---

## Testar formulário de cadastro

```
1. browser_navigate("https://seusite.com/cadastro")
2. browser_snapshot()
3. browser_take_screenshot()

# Caminho feliz com dados únicos
4. browser_fill_form({
     nome: "Usuário Teste QA",
     email: "qa+$(date +%s)@exemplo.com",   # email único por run
     senha: "SenhaSegura123!",
     confirmar_senha: "SenhaSegura123!"
   })
5. browser_click(ref_botao_cadastrar)
6. browser_take_screenshot()               # sucesso ou erro?

# Validação de email duplicado
7. browser_navigate("https://seusite.com/cadastro")
8. browser_fill_form({email: "$TEST_EMAIL_EXISTENTE"})
9. browser_click(ref_botao_cadastrar)
10. browser_take_screenshot()              # erro "email já cadastrado"?

# Senhas diferentes
11. browser_navigate("https://seusite.com/cadastro")
12. browser_fill_form({senha: "Senha1!", confirmar_senha: "Senha2!"})
13. browser_click(ref_botao_cadastrar)
14. browser_take_screenshot()              # erro de confirmação?
```

---

## Testar checkout (e-commerce)

```
1. browser_navigate("https://seusite.com/produto/qualquer")
2. browser_take_screenshot()
3. browser_click(ref_adicionar_ao_carrinho)
4. browser_take_screenshot()               # item adicionado?
5. browser_navigate("https://seusite.com/carrinho")
6. browser_snapshot()
7. browser_take_screenshot()

# Verificar cálculos
8. Anotar subtotal, frete, total — conferir manualmente se somam

# Preencher dados de entrega
9. browser_click(ref_finalizar_pedido)
10. browser_fill_form({
      nome: "Teste QA",
      email: "$TEST_EMAIL",
      cep: "01310-100",
      # ... demais campos
    })
11. browser_take_screenshot()

# NUNCA preencher dados de cartão reais
# Use o ambiente de sandbox/teste do gateway de pagamento
```

---

## Comparar staging vs produção

Teste as mesmas URLs nos dois ambientes e compare:

```
# Produção
1. browser_navigate("https://www.seusite.com")
2. browser_take_screenshot()               # salvar como prod-home.png
3. browser_console_messages()             # anotar erros

# Staging
4. browser_navigate("https://staging.seusite.com")
5. browser_take_screenshot()               # salvar como staging-home.png
6. browser_console_messages()             # anotar erros

# Comparar visualmente e por erros de console
```

Faça o mesmo para as páginas críticas (produto, carrinho, login).

---

## Testar responsividade

```
# Mobile (iPhone 14 Pro)
1. browser_resize(393, 852)
2. browser_navigate("https://seusite.com")
3. browser_take_screenshot()               # menu hambúrguer visível?
4. browser_click(ref_menu_hamburguer)
5. browser_take_screenshot()               # menu abriu?

# Tablet (iPad)
6. browser_resize(768, 1024)
7. browser_navigate("https://seusite.com")
8. browser_take_screenshot()               # layout tablet correto?

# Desktop padrão
9. browser_resize(1280, 800)
10. browser_navigate("https://seusite.com")
11. browser_take_screenshot()

# Desktop largo
12. browser_resize(1920, 1080)
13. browser_take_screenshot()              # linha muito longa? max-width ok?
```

---

## Testar upload de arquivo

```
1. browser_navigate("https://seusite.com/upload")
2. browser_snapshot()
3. browser_take_screenshot()

# Upload válido
4. browser_file_upload(ref_campo_upload, "/caminho/arquivo_teste.pdf")
5. browser_take_screenshot()               # preview ou confirmação?
6. browser_click(ref_botao_enviar)
7. browser_take_screenshot()               # sucesso?

# Arquivo muito grande
8. browser_file_upload(ref_campo_upload, "/caminho/arquivo_grande.pdf")
9. browser_take_screenshot()               # erro de tamanho?

# Tipo de arquivo inválido
10. browser_file_upload(ref_campo_upload, "/caminho/arquivo.exe")
11. browser_take_screenshot()              # erro de tipo?
```

---

## Testar recuperação de senha

```
1. browser_navigate("https://seusite.com/esqueci-senha")
2. browser_snapshot()
3. browser_fill_form({email: "$TEST_EMAIL"})
4. browser_click(ref_botao_enviar)
5. browser_take_screenshot()               # mensagem de confirmação?
6. browser_console_messages()

# Email inexistente (deve mostrar a mesma mensagem por segurança)
7. browser_navigate("https://seusite.com/esqueci-senha")
8. browser_fill_form({email: "inexistente@exemplo.com"})
9. browser_click(ref_botao_enviar)
10. browser_take_screenshot()              # mesma mensagem? (evitar enumerar usuários)
```

---

## Verificar acessibilidade básica

```
1. browser_navigate("https://seusite.com")
2. browser_snapshot()

# Analise o snapshot:
# - Inputs têm labels associadas?
# - Imagens têm alt text?
# - Botões têm texto ou aria-label?
# - Existem elementos com role="presentation" sem sentido?
# - A ordem dos headings faz sentido (h1 > h2 > h3)?

3. browser_evaluate("
  // Verificar contraste básico (requer Lighthouse ou ferramenta dedicada)
  const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
  return inputs.length + ' inputs sem label';
")

4. browser_take_screenshot()
```

Para auditoria completa de acessibilidade, use o Lighthouse via Chrome DevTools MCP.

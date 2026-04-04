# TESTE TÉCNICO: Desenvolvedor n8n — Nível Pleno
**Empresa:** N1 Negócios

## 1. Objetivo
Avaliar a capacidade técnica de construir automações reais utilizando:
* **n8n** (Orquestração de workflow)
* **Integração com APIs**
* **Redis** (Para cache e deduplicação)
* **PostgreSQL** (Para persistência de dados)

## 2. O Desafio
Criar um workflow no **n8n** que processe a entrada de um lead, realize a deduplicação de registros, enriqueça os dados através de APIs externas e salve o resultado final em um banco de dados.

## 3. Requisitos do Sistema

### 1. Entrada (Webhook)
O gatilho deve ser um Webhook configurado para receber o seguinte payload JSON:
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678901",
  "cep": "01001000"
}
```

### 2. Validação
* Validar se todos os campos obrigatórios foram enviados.
* **Se inválido:** Retornar uma mensagem de erro.

### 3. Deduplicação com Redis (Obrigatório)
O sistema deve verificar a existência do lead para evitar duplicidade:
* **Chave de verificação:** `lead:{cpf}`
* **Se existir:** Retornar `{ "status": "DUPLICATE" }`.
* **Se não existir:** Salvar a chave no Redis com um **TTL (Time To Live)** de 300 segundos.

### 4. Integração com API 1 (Consulta Externa)
* **Endpoint:** `https://jsonplaceholder.typicode.com/users`
* **Tratamento:** O workflow deve tratar possíveis erros de integração nesta etapa.

### 5. Integração com API 2 (Enriquecimento via CEP)
* **Endpoint:** `https://viacep.com.br/ws/{cep}/json/`
* **Dados a extrair:** Cidade, Estado e Logradouro.

### 6. Regra de Negócio (Status)
* **Sucesso total:** Se todas as etapas forem concluídas, definir status como `LEAD_VALID`.
* **Falha em API:** Se houver falha nas integrações, definir status como `LEAD_ERROR`.

### 7. Persistência no PostgreSQL
Salvar os dados processados na tabela `leads`. Os campos mínimos obrigatórios são:
* `name`, `email`, `cpf`, `cep`, `status`, `created_at`.

### 8. Resposta do Workflow
O workflow deve retornar uma resposta imediata ao final do processamento:
* **Opção A:** `{ "status": "LEAD VALID" }`
* **Opção B:** `{ "status": "DUPLICATE" }`

---

## 4. Entrega
* Arquivo **JSON** exportado do workflow n8n.
* Uma **breve explicação** técnica a ser apresentada em reunião.

## 5. Diferenciais (Opcional)
* Disponibilizar um arquivo **Docker Compose** configurado com todas as ferramentas (n8n, Redis, PostgreSQL).
* Providenciar uma **documentação detalhada** de como a integração foi estruturada.

---
**Boa sorte!**
*N1 Negócios — Processo Seletivo Teste Técnico n8n Pleno*
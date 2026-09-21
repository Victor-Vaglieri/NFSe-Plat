# VeVOn NFSe SaaS

**VeVOn NFSe SaaS** é uma plataforma moderna e completa (Full-Stack) voltada para a gestão fiscal, contratos de serviço (Ordens de Serviço) e emissão de notas fiscais de serviço eletrônicas (NFS-e). O sistema inclui desde painéis gerenciais robustos até a exportação de dados para softwares contábeis via arquivos magnéticos SPED.

A plataforma apresenta um Front-end moderno (Dark Mode, Glassmorphism) construído em Next.js e Tailwind, com foco rigoroso em UI/UX e privacidade de dados, além de um backend flexível focado em processamento assíncrono e segurança.

## 1. Visão Geral (O Problema)

Gerenciar o faturamento mensal de serviços dezenas de clientes e gerar a contabilidade final de forma automatizada. 
* **Para a Empresa:** Controle de Faturamento, Ordens de Serviço (OS) e emissão nativa (mock PKI) das notas (NFS-e).
* **Para a Contabilidade:** Em vez de receber PDFs soltos ou faturamentos perdidos, a plataforma gera PDFs de fechamento vetoriais e emite o arquivo posicional SPED Fiscal (.txt) para integração perfeita com sistemas como Domínio Sistemas.

## 2. Roteiro e Fases de Desenvolvimento

1. **Fase 1 (Core & Segurança) - CONCLUÍDA:** Autenticação robusta JWT, Isolamento Multi-tenant (cada empresa só enxerga seus dados via `tenant_cnpj`), e motor de Parser de PDF (Upload/Leitura).
2. **Fase 2 (Migração e Resiliência) - CONCLUÍDA:** Integração da estrutura de Backends agnósticos (Java Spring Boot ou FastAPI Python) compartilhando o mesmo SQLite/File System.
3. **Fase 3 (Contratos e Ordens de Serviço) - CONCLUÍDA:** O módulo de "Service Orders" e "Contracts", gerando uma arquitetura real de faturamento em lote.
4. **Fase 4 (Módulo Emissor e Criptografia A1) - CONCLUÍDA:** Construção do motor de faturamento. Implementação de assinaturas digitais RSA-SHA256 (mock) simulando certificado e-CNPJ (A1) e geração de DANFE/PDF via Canvas (ReportLab).
5. **Fase 4.5 (Relatórios Gerenciais e BI) - CONCLUÍDA:** Criação do motor de agregação (Fechamento Mensal) assíncrono com geração nativa de dashboards em PDF (gráfico de pizza vetorial) usando `reportlab` e fusão de PDF usando `PyMuPDF`. Cache reativo no banco de dados para prevenir DoS.
6. **Fase 5 (SPED Fiscal e UX SaaS) - CONCLUÍDA:** Pivot de negócio para vertical única de serviços (NFS-e SaaS). Refatoração completa da UI/UX da aplicação inteira (Sidebars Modernas, Privacy Mode/Modo Ocultar Sensível). Criação do módulo de exportação SPED (.txt) em layout posicional estruturado para sistemas contábeis.

## 3. Tecnologias e Ferramentas (Stack)

* **Frontend (Next.js 14 / React):** Interface de usuário rica, Tailwind CSS (Glassmorphism, Dark/Light Mode, Interatividade de UI), TypeScript.
* **Backend A (Python 3.12 / FastAPI):** Construção ideal para integração com bibliotecas de PDF e OCR (`PyMuPDF`, `reportlab`, `pytesseract`).
* **Backend B (Java 21 / Spring Boot 3):** Reconstrução do backend para alta escalabilidade e tipagem forte em ambiente enterprise. Utiliza `Apache PDFBox`.
* **Banco de Dados:** Padrão Microserviços (Auth DB e App DB) utilizando SQLite/PostgreSQL, mapeados via SQLAlchemy (Python) e Hibernate/JPA (Java).

## 4. Estrutura do Projeto

```text
NFSe/
├── frontend/             # Aplicação Next.js (Dashboard, SaaS UI Dark/Light)
├── backend-python/       # API Core e Worker (SPED, Emissão, Fechamento)
├── backend-java/         # API Core em Java Spring Boot (Fase 2)
├── uploads/              # Diretório raiz para armazenamento (Compartilhado)
├── auth.db               # Banco de dados central de Autenticação (Compartilhado)
└── nfse.db               # Banco de dados de Aplicação / OS (Compartilhado)
```

## 5. Arquitetura e Fluxos

A plataforma foi desenhada para executar perfeitamente com qualquer um dos Backends, e suporta fluxo complexo de agregação e geração de arquivos contábeis.

### Fluxo de Fechamento & SPED
```mermaid
flowchart TD
    UI[Frontend Next.js] --> |POST /reports/| BackgroundTask
    UI --> |GET /sped/{mês}| DownloadSped
    
    BackgroundTask --> |SQL Alchemy| FetchInvoices[(App DB)]
    BackgroundTask --> |PyMuPDF| MergePDFs(Merge de Anexos)
    BackgroundTask --> |ReportLab| GenDashboard(Dashboard Vetorial PDF)
    GenDashboard --> SaveFile[(Sistema de Arquivos)]
    SaveFile --> |Salva Path| CacheDB[(Tabela de Cache 24h)]
    
    DownloadSped --> |String Posicional TXT| TXTGenerator[Layout SPED Fiscal]
    TXTGenerator --> UI
```

## 6. Execução e Variáveis de Ambiente

O projeto agora suporta troca de banco de dados (Ex: SQLite para PostgreSQL) e porta da API através do uso de variáveis de ambiente (`.env`).

### Variáveis de Ambiente Necessárias
1. **Frontend (`frontend/.env.local`):**
   - `NEXT_PUBLIC_API_URL`: Rota da API (ex: `http://localhost:8080/api/v1` para Java ou `http://localhost:8000/api/v1` para Python).
2. **Java (`backend-java/.env`):**
   - `DB_AUTH_URL` e `DB_APP_URL`
   - `JWT_SECRET` e `UPLOAD_DIR`
3. **Python (`backend-python/.env`):**
   - `AUTH_DATABASE_URL` e `APP_DATABASE_URL`
   - `SECRET_KEY`

### Passo a Passo

1. **Frontend (Next.js):**
    ```bash
    cd frontend
    npm run dev
    ```
2. **Backend (Java):** 
    ```bash
    cd backend-java
    ./mvnw spring-boot:run
    ```
3. **Backend (Python - Alternativa Recomendada):** 
    ```bash
    cd backend-python
    venv\Scripts\activate
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```

## 7. Motivação e Escolhas Arquiteturais (Trade-offs)

* **Privacy Mode Global (UI/UX):** Para resolver o problema de gravação de tela em call com clientes (apresentação do SaaS), o frontend introduziu um "Modo Privacidade" (Ícone do Olho) na barra superior que oblitera instantaneamente todos os valores monetários (`R$ ****,**`) e CPFs/CNPJs das tabelas, preservando LGPD e segredos de faturamento. Esse estado persiste via `localStorage`.
* **Exportação SPED (.txt) Dinâmica:** Sistemas contábeis operam via arquivos de texto (tamanho fixo ou pipes `|`). O gerador SPED foi isolado numa rota dedicada, retornando diretamente um `.txt` codificado com suporte a download instantâneo via Browser Blob.
* **PKI Mockada (Assinatura RSA):** Para demonstrar proficiência em segurança da informação sem depender de certificados A1 reais (pagos) ou instabilidade de homologação SEFAZ, o script `generate_mock_cert.py` emite chaves `.pem` e o backend assina o XML usando `signxml` (XML Signature).
* **Cache Reativo e Prevenção de DoS (Relatórios):** A geração de Fechamento exige cálculos vetoriais. Para impedir o esgotamento de CPU, a `BackgroundTasks` joga a carga assíncrona, salva em disco e atualiza a referência na tabela `reports`. Requisições do mesmo mês num ciclo de 24 horas são interceptadas no banco em O(1), custando zero CPU extra.
* **Interoperabilidade de Contratos (SNAKE_CASE Java):** O backend Java utiliza o `spring.jackson.property-naming-strategy: SNAKE_CASE` para equalizar a resposta dos DTOs com as respostas do Python, prevenindo a quebra de tipagem do frontend consumindo APIs diferentes.

## 8. Próximos Passos (Backlog Futuro)

* **Assinatura PKCS#12 Real:** Migrar a infraestrutura do simulador de RSA `.pem` para consumir certificados A1 `.pfx / .p12` de clientes em produção.
* **Webhooks e Mensageria:** Integração com RabbitMQ / Redis Pub/Sub para notificar o frontend em tempo real (via SSE ou WebSocket) sobre a conclusão da geração dos relatórios massivos de fim de mês.
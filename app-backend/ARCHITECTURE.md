# Arquitetura

Documento de referência sobre as tecnologias, convenções e organização de pastas do backend. Não descreve regras de negócio, domínios ou nomes específicos de módulos/arquivos.

## Stack principal

- **Runtime/Framework**: Node.js + [NestJS](https://nestjs.com/), rodando sobre Express (adapter explícito).
- **Linguagem**: TypeScript (modo `strict`, decorators habilitados).
- **Banco de dados**: PostgreSQL, acessado via [Prisma ORM](https://www.prisma.io/) (client gerado + adapter `pg`).
- **Autenticação/Autorização**: JWT (`@nestjs/jwt` + `passport`), com suporte a papéis (roles) e chave de API interna para comunicação server-to-server.
- **Validação**: `class-validator` + `class-transformer`, aplicados globalmente via `ValidationPipe`.
- **Documentação de API**: Swagger/OpenAPI gerado automaticamente (`@nestjs/swagger`), exposto em uma rota dedicada.
- **Outras libs de suporte**: `bcrypt` (hash), `uuid`, `axios`/`@nestjs/axios` (chamadas HTTP externas), `multer` (upload de arquivos).

## Ferramentas de desenvolvimento

- **Lint/Format**: ESLint (flat config, `typescript-eslint` com type-checking) + Prettier, integrados (erros de formatação viram erro de lint).
- **Testes**: Jest para testes unitários (`*.spec.ts` ao lado do código) e uma suíte separada de testes end-to-end.
- **Build**: `nest build` (compilação TypeScript padrão do Nest CLI).
- **Gerenciador de pacotes**: pnpm.
- **Containerização**: Dockerfile dedicado para ambiente de desenvolvimento.

## Estrutura de pastas

```
app-backend/
├── prisma/              # Schema do banco e migrations
├── src/
│   ├── main.ts          # Bootstrap da aplicação (CORS, pipes globais, Swagger, etc.)
│   ├── app.module.ts     # Módulo raiz, agrega os módulos de feature
│   ├── modules/
│   │   └── <feature>/
│   │       ├── dtos/            # Contratos de entrada/saída (validação)
│   │       ├── repositories/    # Abstração de acesso a dados
│   │       ├── services/        # Regras/lógica reaproveitável
│   │       ├── use-cases/       # Um caso de uso por classe (orquestração)
│   │       ├── types/           # Tipos internos do módulo (quando necessário)
│   │       ├── <feature>.controller.ts
│   │       └── <feature>.module.ts
│   └── shared/
│       ├── decorators/   # Decorators customizados (ex.: usuário atual, papéis, rota pública)
│       ├── guards/       # Guards globais/reutilizáveis (autenticação, autorização, api key)
│       ├── crypto/       # Utilitários de criptografia
│       ├── jwt/          # Configuração de emissão/validação de token
│       ├── password/     # Hash/verificação de senha
│       ├── prisma/       # Cliente Prisma, contexto de request, transações
│       └── types/        # Tipos compartilhados entre módulos
└── test/                 # Testes end-to-end
```

## Convenções de organização por módulo

Cada módulo de feature segue o mesmo recorte, independentemente do domínio:

1. **Controller**: recebe a requisição HTTP, aplica guards/decorators e delega para um use case. Não contém lógica de negócio.
2. **Use case**: uma classe por operação de negócio, orquestra services/repositories. É o ponto de entrada testável da regra de negócio.
3. **Service**: lógica reaproveitável entre use cases (quando necessário).
4. **Repository**: interface abstrata (classe `abstract`) que define o contrato de acesso a dados, com implementação concreta via Prisma. Alguns módulos também mantêm uma implementação em memória, usada em testes.
5. **DTOs**: classes de validação/transformação para entrada e saída da API, decoradas com `class-validator`.
6. **Module**: arquivo `*.module.ts` que declara providers, controllers e imports do Nest, seguindo o padrão de injeção de dependência do framework.

## Convenções transversais (cross-cutting)

- **Autenticação/Autorização**: guard global de chave de API interna aplicado a nível de aplicação, combinado com guards de JWT e de papéis aplicados por rota/controller conforme necessário. Decorators expõem o usuário autenticado e marcam rotas públicas.
- **Contexto de requisição**: uso de armazenamento contextual (CLS) para propagar informações da requisição (ex.: usuário, IP) através das camadas sem precisar repassá-las manualmente.
- **Efeitos colaterais/observabilidade**: interceptors e decorators dedicados permitem registrar eventos de auditoria de forma declarativa, desacoplados da lógica de negócio dos use cases.
- **Configuração**: variáveis de ambiente via `dotenv`, com flags para SSL de banco, proxy confiável, URL do frontend (CORS), etc.

## Testes

- Testes unitários ficam ao lado do código (`*.spec.ts`), cobrindo services, use cases e utilitários compartilhados.
- Repositórios possuem uma variante "in-memory" para permitir testes de use cases sem dependência do banco real.
- Testes end-to-end ficam isolados em uma pasta própria, com configuração Jest dedicada.

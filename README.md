# 🚚 DriverLog (App-Foods)

![DriverLog Cover](https://img.shields.io/badge/Status-Ativo-success)
![Versão](https://img.shields.io/badge/Vers%C3%A3o-1.0.0-blue)
![Tecnologia](https://img.shields.io/badge/Framework7-v9.0-0b9e4a)
![Banco_de_Dados](https://img.shields.io/badge/Firebase-v10.0-FFCA28)

**DriverLog** é uma Single Page Application (SPA) moderna e responsiva projetada para catalogar entregas, registrar fretes diários, e gerenciar faturamento logístico de motoristas ou pequenas frotas. 

O aplicativo permite cadastrar empresas, estipular valores por tipo de entrega (Almoço, Jantar, Ceia, Desjejum, etc.) e computar automaticamente totais diários.

---

## ✨ Funcionalidades Principais

*   **🏠 Dashboard Diário (Home):**
    *   Registro rápido de fretes com base na empresa e no tipo de entrega selecionado.
    *   Listagem em tempo real de todas as entregas do dia com cálculo dinâmico do faturamento total diário.
    *   Navegação facilitada entre os dias letivos (Anterior / Próximo).
*   **🏢 Gerenciamento de Empresas (Cadastro):**
    *   Cadastro customizado de parceiros comerciais.
    *   Atribuição de valores de frete dinâmicos para cada categoria de entrega (*Almoço, Janta, Ceia, Desjejum, Recolha, Ceia/MTX, B.O*).
    *   Edição e Exclusão segura de perfis de empresa.
*   **📊 Relatórios e Fechamento:**
    *   Filtro de longo período (Data Início - Data Fim).
    *   Visualização agrupada por dias da semana e dias corridos.
    *   **Geração Nativa de PDF** formatado com suporte a tabelas inteligentes para fechamento mensal.

---

## 🚀 Tecnologias e Arquitetura

O projeto foi modernizado recentemente para seguir os rigorosos padrões da Web 3.0, garantindo performance de aplicativo nativo e segurança em nuvem.

*   **[Vite](https://vitejs.dev/)**: Utilizado como *Module Bundler* de ponta, permitindo recarga rápida em ambiente local (HMR) e compilação (*Tree-shaking*) otimizada em produção, resolvendo módulos ES (`import/export`).
*   **[Framework7](https://framework7.io/)**: Fornece os componentes visuais "Pixel-Perfect" baseados na Human Interface Guidelines da Apple (iOS). Implementamos layouts em **Glassmorphism**, Tipografia interativa, *Skeleton Loaders* e Física tátil.
*   **[Firebase V10 (Modular SDK)](https://firebase.google.com/)**: O *"BaaS"* (Backend as a Service) responsável pelo **Firestore Database**. A adoção da V10 permite consultas levíssimas e comunicação asíncrona robusta. O app utiliza as variáveis de ambiente protegidas (`.env`) contra acessos indevidos.
*   **Javascript Vanilla Moderno (ES6+)**: Dispensando o uso de bibliotecas de compatibilidade inchadas, rodando regras de negócio limpas em Controladores apartados.

---

## 📦 Estrutura do Projeto (MVC / SoC)

O projeto separa as preocupações (Separation of Concerns) isolando o que é interface, controle e serviço:

```text
app-foods/
├── .env                  # (Oculto) Suas variáveis de ambiente do Firebase
├── index.html            # Ponto de injeção da SPA
├── vite.config.js        # Configuração do builder e portas
├── package.json          # Dependências do NPM
└── src/
    ├── main.js                 # Entrypoint que inicializa o Framework7 e as Rotas
    ├── controllers/            # Controladores das Regras de Interface
    │   ├── home.js
    │   ├── cadastro.js
    │   └── relatorio.js
    ├── services/               
    │   └── firebase.js         # Serviço de inicialização e extração da V10
    └── utils/
        └── date.js             # Funções de conversão UTC e formatação UI
```

---

## 🛠️ Como Executar Localmente

Siga o passo a passo abaixo para rodar o ambiente de desenvolvimento local na sua máquina:

**1. Clone o repositório:**
```bash
git clone https://github.com/RenanMCoutinho/app-foods.git
cd app-foods
```

**2. Instale as dependências Node (NPM):**
```bash
npm install
```

**3. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz do projeto (como o `.env.example`, se houver) e preencha as suas chaves do Firebase Console:
```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_dominio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_storage
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement
```

**4. Inicie o Servidor de Desenvolvimento:**
```bash
npm run dev
```

O aplicativo estará disponível instantaneamente (geralmente em `http://localhost:5173/`).

---

## 💎 Contribuições
Sinta-se livre para abrir **Issues** relatando bugs ou criar **Pull Requests** para novas integrações no fechamento dos PDFs e gráficos!

*Desenvolvido com 💚 focado na eficiência logística.*

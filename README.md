# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Exercise library

The training area uses the static [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) catalog. Exercise metadata is included in `server/data/exercises.json`; static exercise images are loaded from the source repository.

The dataset is dedicated to the public domain under the Unlicense. The catalog and its exercise images are provided as-is; the source repository documents this dedication in `LICENSE.md`.

Run `npm run dev` to start the app. No external API key is needed. For production, run `npm run build` and `npm start`.

## Login e dados na nuvem (Supabase)

Cada aluno entra com e-mail e senha, e perfil, peso, check-ins e treinos ficam salvos na conta (Supabase), aparecendo em qualquer aparelho.

### Configurar (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, cole e rode o arquivo [`supabase/migrations/0001_inicial.sql`](supabase/migrations/0001_inicial.sql). Ele cria as tabelas, as regras de segurança (cada aluno só acessa os próprios dados) e o perfil automático no cadastro. Depois rode também o [`0002_telefone.sql`](supabase/migrations/0002_telefone.sql), que adiciona o WhatsApp do aluno. Para a loja, rode o [`0003_loja.sql`](supabase/migrations/0003_loja.sql) e, se quiser produtos de exemplo, o [`seed_loja.sql`](supabase/seed_loja.sql). Para o painel da academia (fichas de treino do personal), rode o [`0004_painel_adm.sql`](supabase/migrations/0004_painel_adm.sql) e depois o [`0005_modelos_equipe.sql`](supabase/migrations/0005_modelos_equipe.sql) (modelos de treino e página Equipe) e o [`0006_midias_treino.sql`](supabase/migrations/0006_midias_treino.sql) (fotos e vídeos nos exercícios).
3. Copie `.env.example` para `.env.local` e preencha com a **Project URL** e a **Publishable key** (Project Settings → API). A chave `anon` antiga também funciona, em `VITE_SUPABASE_ANON_KEY`.
4. Em **Authentication → URL Configuration**, coloque o endereço do site em *Site URL* e adicione `http://localhost:5173` em *Redirect URLs*. É para onde vão os links de confirmação de e-mail e de recuperação de senha.
5. Opcional: em **Authentication → Emails**, traduza os modelos de e-mail para português.

As variáveis `VITE_*` entram no build: rode `npm run build` de novo sempre que mudar o `.env.local`.

### Como funciona

- **Offline primeiro:** a tela muda na hora e as gravações vão para o servidor em segundo plano (`src/dados/sincronizacao.js`). Sem internet, as alterações ficam guardadas no aparelho e são reenviadas sozinhas quando a conexão volta. O app também abre com a última cópia dos dados enquanto busca a versão atual.
- **Migração:** quem já usava o app sem login tem os dados deste aparelho enviados para a conta no primeiro login (uma vez por aparelho; os dados locais não são apagados).
- **Segurança:** as regras ficam no banco (RLS). O aluno só pode alterar nome e meta do próprio perfil; treinos finalizados ficam travados.
- **Painel da academia:** contas com papel `dono` ou `personal` entram direto no painel (dá para alternar com "Ver como aluno"). O personal monta fichas e vê os dados dos alunos; o dono também gerencia a loja. Para dar o papel a alguém que já criou conta, rode no SQL Editor:
  `update public.perfis set papel = 'personal' where email = 'personal@exemplo.com';` (ou `'dono'`).

## Workout tracking

Monday-Friday follow a sample A-E split (`PLANO_SEMANAL` in `treinoLocal.js`). Each date has independent series and load records, saved to the student's Supabase account (table `sessoes_treino`).

- Each exercise card has an optional load (kg) field with the last value used and a personal-record badge when it beats the best finalized load. Completing today's workout also registers today's check-in.
- Mark each series individually. All prescribed series must be checked to enable workout completion.
- Use **Iniciar treino** to record the session start and jump to the next unfinished exercise. **Continuar treino** resumes the same session without resetting its start time. Direct series marking remains available and starts the session automatically if needed.
- The next unfinished exercise has a **Concluir serie** action that marks its first remaining series, including when series were checked out of order. Numbered buttons still allow individual checking and undoing.
- Each newly checked series starts the exercise's rest timer. It can be paused, resumed or skipped. Switching days or reloading dismisses the timer.
- Open an exercise's name to see the larger image and general guidance.
- Completing a workout saves one finalized session per date and locks its records. Its summary and expandable history retain exercises, series, loads and elapsed time. Time runs from the explicit session start (or first checked series) to completion, including rest and time away from the app. Legacy progress has no original start time, so its duration is shown as unavailable rather than estimated.

Completing today's workout also registers today's check-in.

Run the logic tests with `node --test src/dados/dados.test.js src/componentes/area-treinos/treinoLocal.test.js src/utils/utils.test.js`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

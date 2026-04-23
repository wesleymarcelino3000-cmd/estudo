APP BÍBLIA ACF COM IA

O que vem:
- Bíblia ACF em português como PDF completo: data/acf.pdf
- IA bíblica com 5 modos: chat, explicar, reflexão, oração e estudo
- API server-side em api/ai.js
- Login com Supabase
- Favoritos, anotações e plano de leitura
- PWA com ícone aplicado

Como publicar no Vercel:
1. Suba tudo descompactado no GitHub
2. No Supabase, rode sql/supabase.sql
3. Ative Authentication > Email
4. No Vercel, adicione as variáveis:
   OPENAI_API_KEY = sua chave da OpenAI
   OPENAI_MODEL = gpt-5.4-mini   (opcional)
5. Faça Redeploy

Arquivos importantes:
- index.html
- style.css
- app.js
- config.js
- manifest.json
- sw.js
- api/ai.js
- data/acf.pdf
- icons/icon-192.png
- icons/icon-512.png
- sql/supabase.sql

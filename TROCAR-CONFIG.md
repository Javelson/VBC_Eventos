# Como Trocar a Base de Dados e o Provedor de Email

Guia rapido para alterar as configuracoes do projeto VB Eventos.

---

## 1. Trocar a Base de Dados (Supabase)

### Onde buscar as credenciais novas

1. Vai a [app.supabase.com](https://app.supabase.com)
2. Seleciona o teu projeto (ou cria um novo)
3. Vai a **Settings** > **API**
4. Copia:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (comeca com `eyJhbGci...`)

### Ficheiros que precisam de alteracao

O URL e a chave estao hardcoded em **7 ficheiros JS**. Tens de trocar em todos:

| Ficheiro | Onde esta |
|---|---|
| `script.js` | Linha 8-11 |
| `site-settings.js` | Linha 7-10 |
| `admin/login.html` | Linha 41-42 |
| `classificacao.js` | Linha 7-10 |
| `admin-script.js` | Linha 7-10 |
| `admin-events.js` | Linha 7-10 |
| `admin-page.js` | Linha 7-10 |
| `admin-classificacoes.js` | Linha 7-10 |

### O que trocar

Em cada ficheiro, procura este bloco:

```javascript
const db = createClient(
  "URL-ANTIGO-AQUI",
  "CHAVE-ANTIGA-AQUI"
);
```

E substitui por:

```javascript
const db = createClient(
  "https://NOVO-PROJETO.supabase.co",
  "NOVA-CHAVE-ANON-AQUI"
);
```

### Tabelas necessarias na nova base de Dados

Precisas de criar estas tabelas no novo projeto Supabase:

**Tabela `inscricoes`:**
```sql
CREATE TABLE public.inscricoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text NOT NULL,
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.inscricoes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated all" ON public.inscricoes
  FOR ALL TO authenticated USING (true);
```

**Tabela `settings`:**
```sql
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.settings
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated all" ON public.settings
  FOR ALL TO authenticated USING (true);
```

**Tabela `feedback`:**
```sql
CREATE TABLE public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert feedback" ON public.feedback
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated read feedback" ON public.feedback
  FOR SELECT TO authenticated USING (true);
```

**Storage bucket `flyers`:**
1. Vai a **Storage** no painel Supabase
2. Cria um bucket chamado `flyers`
3. Torna-o **publico** (Public bucket)

**Autenticacao:**
1. Vai a **Authentication** > **Users**
2. Cria um utilizador admin com o email/password que queres
3. Atualiza as credenciais em `.env.local`:
   ```
   ADMIN_EMAIL=teu@email.com
   ADMIN_PASSWORD=teu_password
   ```

---

## 2. Trocar o Provedor de Email

O email e enviado pelo ficheiro `api/confirmar.php` usando **PHPMailer + SMTP**.

### Opcao A: Manter PHPMailer (trocar so o servidor SMTP)

Abre `api/confirmar.php` e altera as constantes no inicio do ficheiro:

```php
// --- Config SMTP ---
define("SMTP_HOST", "NOVO-SERVIDOR.smtp.com");  // Ex: smtp.gmail.com, smtp.gmail.com, mail.dominio.com
define("SMTP_PORT", 465);                         // 465 para SSL, 587 para TLS
define("SMTP_USER", "teu-email@dominio.com");
define("SMTP_PASS", "tua-password-ou-app-password");
define("SMTP_FROM", "teu-email@dominio.com");
define("SMTP_FROM_NAME", "VB Conexao");
```

**Exemplos de provedores:**

| Provedor | Host | Porta | Seguranca |
|---|---|---|---|
| Gmail | `smtp.gmail.com` | 465 | SSL |
| Outlook/Hotmail | `smtp-mail.outlook.com` | 587 | TLS |
| Yahoo | `smtp.mail.yahoo.com` | 465 | SSL |
| cPanel/aPanel | `mail.teudominio.com` | 465 | SSL |
| Zoho | `smtp.zoho.com` | 465 | SSL |

> **Nota para Gmail:** Precisas de criar uma "App Password" em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). A password normal nao funciona.

### Opcao B: Trocar para Resend (API moderna)

Se preferires usar [Resend](https://resend.com) em vez de SMTP:

1. Cria conta em [resend.com](https://resend.com)
2. Obtem a API key
3. Substitui todo o conteudo de `api/confirmar.php` por:

```php
<?php
/**
 * confirmar.php - Endpoint para confirmacao de inscricoes
 * Envia e-mail automatico via Resend API
 */

// --- Config ---
$RESEND_API_KEY = "re_TUA_API_KEY_AQUI";

// --- CORS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$nome  = isset($input["nome"])  ? trim($input["nome"])  : "";
$email = isset($input["email"]) ? trim($input["email"]) : "";

if ($nome === "" || $email === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Campos obrigatorios"]);
    exit;
}

$nomeSafe = htmlspecialchars($nome, ENT_QUOTES, "UTF-8");

$html = '<h1>Inscricao Confirmada!</h1>
<p>Ola <strong>' . $nomeSafe . '</strong>, a sua inscricao foi confirmada.</p>';

$ch = curl_init("https://api.resend.com/emails");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . $RESEND_API_KEY,
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "from" => "VB Conexao <onboarding@resend.dev>",
        "to" => [$email],
        "subject" => "Inscricao Confirmada - VB Conexao",
        "html" => $html
    ])
]);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200 || $httpCode === 201) {
    echo json_encode(["success" => true, "message" => "E-mail enviado"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Falha ao enviar"]);
}
```

### Opcao C: Trocar para SendGrid

Substitui o bloco SMTP em `api/confirmar.php` pela integracao com a API do SendGrid (semelhante ao Resend, usa cURL).

---

## 3. Checklist rapido

- [ ] Criar novo projeto Supabase
- [ ] Criar tabelas (`inscricoes`, `settings`, `feedback`)
- [ ] Criar bucket `flyers` (publico)
- [ ] Criar utilizador admin na Auth
- [ ] Trocar URL + chave nos 7 ficheiros JS
- [ ] Atualizar `.env.local` com novas credenciais
- [ ] Configurar SMTP ou API de email em `api/confirmar.php`
- [ ] Testar inscricao no formulario
- [ ] Testar confirmacao de email no admin
- [ ] Testar classificacao

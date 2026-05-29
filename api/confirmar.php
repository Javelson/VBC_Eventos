<?php
/**
 * confirmar.php - Endpoint para confirmacao de inscricoes
 * Envia e-mail automatico ao inscrito via PHPMailer + SMTP
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . "/vendor/PHPMailer/Exception.php";
require __DIR__ . "/vendor/PHPMailer/PHPMailer.php";
require __DIR__ . "/vendor/PHPMailer/SMTP.php";

// --- Config SMTP ---
define("SMTP_HOST", "mail.vbc.ao");
define("SMTP_PORT", 465);
define("SMTP_USER", "eventos@vbc.ao");
define("SMTP_PASS", "+-Passw0rd2026");
define("SMTP_FROM", "eventos@vbc.ao");
define("SMTP_FROM_NAME", "VB Conexao");

// --- CORS Headers ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Apenas POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// --- Ler body JSON ---
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "JSON invalido"]);
    exit;
}

// --- Validar campos obrigatorios ---
$nome  = isset($input["nome"])  ? trim($input["nome"])  : "";
$email = isset($input["email"]) ? trim($input["email"]) : "";

if ($nome === "" || $email === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Campos obrigatorios: nome, email"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "E-mail invalido"]);
    exit;
}

// --- Sanitizar para o template ---
$nomeSafe = htmlspecialchars($nome, ENT_QUOTES, "UTF-8");

// --- Template do E-mail ---
$subject = "Inscricao Confirmada - VB Conexao";

$html = '
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4">
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f4f4;padding:40px 20px">
  <div style="background:#ffffff;border-radius:12px;padding:40px 30px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:30px">
      <div style="background:#005696;color:#ffffff;display:inline-block;padding:8px 20px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px">VB Conexao</div>
    </div>

    <!-- Confirmacao -->
    <div style="text-align:center;margin-bottom:30px">
      <div style="background:#22c55e;color:#ffffff;width:60px;height:60px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:16px">&#10003;</div>
      <h1 style="color:#1a1a1a;font-size:24px;margin:0 0 8px">Inscricao Confirmada!</h1>
      <p style="color:#666;font-size:16px;margin:0">A sua presenca foi confirmada com sucesso.</p>
    </div>

    <!-- Mensagem -->
    <div style="background:#f0f9ff;border-left:4px solid #005696;padding:20px;border-radius:0 8px 8px 0;margin-bottom:30px">
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0">
        Ola <strong>' . $nomeSafe . '</strong>,<br><br>
        Temos o prazer de confirmar a sua inscricao no evento <strong>FortiGate Experience</strong>.
        Prepararamos uma experiencia unica e imersiva sobre seguranca de rede que nao vai querer perder!
      </p>
    </div>

    <!-- Detalhes do Evento -->
    <div style="background:#fafafa;border-radius:8px;padding:24px;margin-bottom:30px">
      <h3 style="color:#005696;font-size:16px;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px">Detalhes do Evento</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px;width:30px">&#128197;</td>
          <td style="padding:8px 0;color:#333;font-size:14px"><strong>Data:</strong> 06 de Junho, 2026</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px">&#128336;</td>
          <td style="padding:8px 0;color:#333;font-size:14px"><strong>Horario:</strong> 15h00 - 17h00</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px">&#128187;</td>
          <td style="padding:8px 0;color:#333;font-size:14px"><strong>Plataforma:</strong> Microsoft Teams</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px">&#9889;</td>
          <td style="padding:8px 0;color:#333;font-size:14px"><strong>Duracao:</strong> 2 horas (pratica)</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:30px">
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0">
        Em breve recebera o link de acesso e mais instrucoes por e-mail.<br>
        Fique atento(a) a sua caixa de entrada!
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #eee;padding-top:20px;text-align:center">
      <p style="color:#999;font-size:12px;margin:0">
        Este e-mail foi enviado automaticamente pelo sistema VB Conexao.<br>
        Se tem alguma duvida, responda a este e-mail.
      </p>
    </div>

  </div>
</div>
</body>
</html>';

// --- Enviar via PHPMailer SMTP ---
$mail = new PHPMailer(true);

try {
    // Servidor SMTP
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL na porta 465
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = "UTF-8";

    // Remetente e destinatario
    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress($email, $nome);

    // Conteudo
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $html;
    $mail->AltBody = "Ola {$nome}, a sua inscricao foi confirmada com sucesso. Data: 06 de Junho, 2026 - Horario: 15h00 - 17h00.";

    $mail->send();
    echo json_encode(["success" => true, "message" => "E-mail enviado com sucesso"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Falha ao enviar e-mail: " . $mail->ErrorInfo]);
}

<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';
require __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

const MAX_PER_HOUR = 5;
const MIN_SECONDS_ON_PAGE = 3;
const NEEDS = ['Site web', 'Application web ou SaaS', 'Agent IA ou automatisation', 'Renfort ou CTO'];

function respond(int $status, bool $success, string $error = ''): void
{
    http_response_code($status);
    echo json_encode($error === '' ? ['success' => $success] : ['success' => $success, 'error' => $error]);
    exit();
}

// Supprime les caractères de contrôle ; garde les retours à la ligne seulement si $multiline.
function clean(string $value, int $maxLength, bool $multiline = false): ?string
{
    $value = trim($value);
    $pattern = $multiline ? '/[^\P{C}\n\t]/u' : '/\p{C}/u';
    $value = preg_replace($pattern, '', $value);
    if ($value === null || mb_strlen($value) > $maxLength) {
        return null;
    }
    return $value;
}

// Plafond d'envois par IP, compté dans un fichier temporaire (hébergement mutualisé, sans base de données).
function rateLimited(string $ip): bool
{
    $file = sys_get_temp_dir() . '/lfdw-contact-' . hash('sha256', $ip);
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        return false;
    }
    flock($handle, LOCK_EX);
    $now = time();
    $hits = array_filter(
        array_map('intval', explode(',', stream_get_contents($handle) ?: '')),
        fn ($t) => $t > $now - 3600
    );
    $limited = count($hits) >= MAX_PER_HOUR;
    if (!$limited) {
        $hits[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, implode(',', $hits));
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Méthode non autorisée');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) {
    respond(403, false, 'Origine refusée');
}

// Champ piège invisible : un humain le laisse vide. On répond « succès » pour ne rien apprendre au robot.
if (($_POST['website'] ?? '') !== '') {
    respond(200, true);
}

$startedAt = (int) ($_POST['started_at'] ?? 0);
if ($startedAt === 0 || time() - intdiv($startedAt, 1000) < MIN_SECONDS_ON_PAGE) {
    respond(400, false, 'Envoi trop rapide');
}

$name = clean($_POST['name'] ?? '', 100);
$email = filter_var(clean($_POST['email'] ?? '', 254) ?? '', FILTER_VALIDATE_EMAIL);
$structure = clean($_POST['structure'] ?? '', 150);
$need = in_array($_POST['besoin'] ?? '', NEEDS, true) ? $_POST['besoin'] : 'Non précisé';
$message = clean($_POST['message'] ?? '', 5000, true);

if (!$name || !$email || $structure === null || !$message) {
    respond(422, false, 'Champs invalides');
}

if (rateLimited($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
    respond(429, false, 'Trop de messages envoyés');
}

$config = require __DIR__ . '/config.mail.php';
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($config['username'], $config['name']);
    $mail->addAddress($config['username']);
    $mail->addReplyTo($email, $name);

    $mail->Subject = 'Nouveau message depuis le site';
    $mail->Body = "Nom : $name\nEmail : $email\nStructure : $structure\nBesoin : $need\n\nMessage :\n$message";

    $mail->send();
    respond(200, true);
} catch (Exception $e) {
    error_log('Formulaire de contact : ' . $mail->ErrorInfo);
    respond(500, false, "L'envoi a échoué");
}

<?php
require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = htmlspecialchars(trim($_POST['name'] ?? ''));
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    $message = htmlspecialchars(trim($_POST['message'] ?? ''));

    if (!$name || !$email || !$message) {
        echo json_encode(['success' => false, 'error' => 'Champs invalides']);
        exit();
    }

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = 'mail.infomaniak.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'site@ton-domaine.com'; // ton adresse d’envoi
        $mail->Password = 'TON_MDP_INFOMANIAK';   // mot de passe SMTP
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        $mail->setFrom('site@ton-domaine.com', 'La Forge du Web');
        $mail->addAddress('ton-email@ton-domaine.com');
        $mail->addReplyTo($email, $name);

        $mail->Subject = 'Nouveau message depuis le site';
        $mail->Body = "Nom : $name\nEmail : $email\n\nMessage :\n$message";

        $mail->send();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $mail->ErrorInfo]);
    }
}
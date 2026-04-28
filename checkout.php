<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$accessToken = 'APP_USR-4540005447639242-042719-fd5dd13aac31912651bca600314b1720-3364931348'; 

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
    exit;
}

// Calcula o total
$total = 0;
foreach ($data['cart'] as $item) {
    $total += (float)$item['price'] * (int)$item['quantity'];
}
if (isset($data['freight'])) {
    $total += (float)$data['freight'];
}

$siteUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$baseDir = dirname($_SERVER['REQUEST_URI']);
$baseUrl = rtrim($siteUrl . $baseDir, '/');
$isLocalhost = (strpos($baseUrl, 'localhost') !== false || strpos($baseUrl, '127.0.0.1') !== false);

// Dados para criação do Pagamento via Pix Direto (Checkout Transparente)
$paymentData = [
    'transaction_amount' => round($total, 2),
    'description' => 'Pedido AGS Delivery',
    'payment_method_id' => 'pix',
    'payer' => [
        'email' => 'cliente@agsdelivery.com.br',
        'first_name' => $data['customerName'] ?? 'Cliente',
        'last_name' => 'AGS'
    ],
    'external_reference' => uniqid('AGS_'),
    'notification_url' => $isLocalhost ? 'https://www.google.com' : $baseUrl . '/webhook.php'
];

$ch = curl_init('https://api.mercadopago.com/v1/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json',
    'X-Idempotency-Key: ' . uniqid()
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$responseData = json_decode($response, true);

if ($httpCode == 201 || $httpCode == 200) {
    // Retornamos os dados do Pix para o JavaScript
    echo json_encode([
        'success' => true,
        'qr_code' => $responseData['point_of_interaction']['transaction_data']['qr_code'],
        'qr_code_base64' => $responseData['point_of_interaction']['transaction_data']['qr_code_base64'],
        'payment_id' => $responseData['id']
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'error' => 'Erro ao criar Pix', 
        'details' => $responseData
    ]);
}
?>
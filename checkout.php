<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$accessToken = 'APP_USR-4540005447639242-042719-fd5dd13aac31912651bca600314b1720-3364931348'; 

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['error' => 'Dados inválidos']);
    exit;
}

$items = [];
foreach ($data['cart'] as $item) {
    $items[] = [
        'title' => $item['name'],
        'quantity' => (int) $item['quantity'],
        'unit_price' => round((float) $item['price'], 2),
        'currency_id' => 'BRL'
    ];
}

if (isset($data['freight']) && $data['freight'] > 0) {
    $items[] = [
        'title' => 'Taxa de Entrega',
        'quantity' => 1,
        'unit_price' => round((float) $data['freight'], 2),
        'currency_id' => 'BRL'
    ];
}

$siteUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$baseDir = dirname($_SERVER['REQUEST_URI']);
$baseUrl = rtrim($siteUrl . $baseDir, '/');
$isLocalhost = (strpos($baseUrl, 'localhost') !== false || strpos($baseUrl, '127.0.0.1') !== false);

$preferenceData = [
    'items' => $items,
    'payer' => [
        'name' => $data['customerName'] ?? 'Cliente',
        'email' => 'cliente@agsdelivery.com.br'
    ],
    'payment_methods' => [
        'excluded_payment_types' => [
            ['id' => 'ticket']
        ],
        'installments' => 1
    ],
    'external_reference' => uniqid('AGS_')
];

// O Mercado Pago exige URLs reais. No localhost, não enviamos para evitar erro.
if (!$isLocalhost) {
    $preferenceData['back_urls'] = [
        'success' => $baseUrl . '/sucesso.html',
        'failure' => $baseUrl . '/index.html?status=failure',
        'pending' => $baseUrl . '/index.html?status=pending'
    ];
    $preferenceData['auto_return'] = 'approved';
    $preferenceData['notification_url'] = $baseUrl . '/webhook.php';
}

$ch = curl_init('https://api.mercadopago.com/checkout/preferences');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preferenceData));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$responseData = json_decode($response, true);

if ($httpCode == 201 || $httpCode == 200) {
    echo json_encode(['success' => true, 'init_point' => $responseData['init_point']]);
} else {
    echo json_encode(['success' => false, 'error' => 'Erro ao comunicar com Mercado Pago', 'details' => $responseData]);
}
?>
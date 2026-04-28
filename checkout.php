<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// ATENÇÃO: Substitua pelo seu Access Token de Produção do Mercado Pago
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
        'unit_price' => (float) $item['price'],
        'currency_id' => 'BRL'
    ];
}

// Adiciona taxa de entrega se existir
if (isset($data['freight']) && $data['freight'] > 0) {
    $items[] = [
        'title' => 'Taxa de Entrega',
        'quantity' => 1,
        'unit_price' => (float) $data['freight'],
        'currency_id' => 'BRL'
    ];
}

$siteUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
$baseDir = dirname($_SERVER['REQUEST_URI']);
$baseUrl = rtrim($siteUrl . $baseDir, '/');

$preferenceData = [
    'items' => $items,
    'payer' => [
        'name' => $data['customerName'] ?? 'Cliente',
        'email' => 'cliente@agsdelivery.com.br' // Email é frequentemente obrigatório na API do MP
    ],
    'back_urls' => [
        'success' => $baseUrl . '/sucesso.html',
        'failure' => $baseUrl . '/index.html?status=failure',
        'pending' => $baseUrl . '/index.html?status=pending'
    ],
    'auto_return' => 'approved',
    'payment_methods' => [
        'excluded_payment_types' => [
            ['id' => 'ticket'] // Exclui boletos
        ],
        'installments' => 1
    ],
    'external_reference' => uniqid('AGS_')
];

// O Mercado Pago BLOQUEIA a geração do Pix se a URL de notificação for 'localhost'.
// Se estiver em localhost, enviamos uma URL genérica só para ele deixar testar a tela.
if (strpos($baseUrl, 'localhost') === false && strpos($baseUrl, '127.0.0.1') === false) {
    $preferenceData['notification_url'] = $baseUrl . '/webhook.php';
} else {
    $preferenceData['notification_url'] = 'https://www.google.com'; // Dummy URL apenas para não dar erro 400 no teste
}

$ch = curl_init('https://api.mercadopago.com/checkout/preferences');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preferenceData));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // NECESSÁRIO NO XAMPP: ignora erro de certificado local
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

$responseData = json_decode($response, true);

if ($response === false) {
    echo json_encode(['success' => false, 'error' => 'Erro interno do cURL', 'details' => $curlError]);
    exit;
}

if ($httpCode == 201 || $httpCode == 200) {
    // Salva temporariamente os dados do pedido para cruzar com o webhook depois (opcional)
    $pedidoInfo = [
        'referencia' => $preferenceData['external_reference'],
        'cliente' => $data['customerName'],
        'telefone' => $data['customerPhone'],
        'endereco' => $data['deliveryAddress'] ?? 'Retirada',
        'itens' => $data['cart'],
        'total' => array_sum(array_column($items, 'unit_price'))
    ];
    file_put_contents('pedidos_pendentes.json', json_encode($pedidoInfo) . PHP_EOL, FILE_APPEND);

    echo json_encode(['success' => true, 'init_point' => $responseData['init_point']]);
} else {
    echo json_encode(['success' => false, 'error' => 'Erro ao comunicar com Mercado Pago', 'details' => $responseData]);
}
?>
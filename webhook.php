<?php
// O Mercado Pago exige que o webhook responda com status 200/201 rapidamente.
http_response_code(200);

// ATENÇÃO: Substitua pelo seu Access Token de Produção
$accessToken = 'APP_USR-SEU_ACCESS_TOKEN_AQUI'; 

// Lendo o corpo da requisição do Mercado Pago
$body = file_get_contents('php://input');
$data = json_decode($body, true);

// Verifica se é uma notificação de pagamento
if (isset($data['type']) && $data['type'] === 'payment') {
    $paymentId = $data['data']['id'];

    // Consulta os detalhes do pagamento na API do MP para evitar fraudes (Spoofing)
    $ch = curl_init('https://api.mercadopago.com/v1/payments/' . $paymentId);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $paymentInfo = json_decode($response, true);
    
    // Se o pagamento estiver aprovado
    if ($paymentInfo && $paymentInfo['status'] === 'approved') {
        $externalReference = $paymentInfo['external_reference'];
        $valor = $paymentInfo['transaction_amount'];
        $metodo = $paymentInfo['payment_method_id'];
        
        // AQUI ENTRA A SUA LÓGICA DE NEGÓCIO PÓS-PAGAMENTO
        // Ex: Atualizar status no banco de dados, enviar email, ou notificar no WhatsApp da loja
        
        $logMessage = date('Y-m-d H:i:s') . " - PAGAMENTO APROVADO! Ref: $externalReference | Valor: R$ $valor | Método: $metodo\n";
        file_put_contents('pedidos_aprovados.log', $logMessage, FILE_APPEND);
        
        // (Opcional) Você pode usar uma API de WhatsApp aqui para avisar a cozinha automaticamente
    }
}
?>

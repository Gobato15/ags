<?php
// ATENÇÃO: Primeiro, é necessário instalar a SDK do Mercado Pago via Composer:
// No terminal (na mesma pasta desse arquivo) rode: composer require mercadopago/dx-php

require_once 'vendor/autoload.php';

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

// 1. Adicione o seu Token de Acesso de Testes ou Produção (Access Token)
MercadoPagoConfig::setAccessToken("SEU_ACCESS_TOKEN_AQUI");

function gerar_link_pagamento() {
    // 2. Inicializa o cliente de Preferências
    $client = new PreferenceClient();

    try {
        // 3. Cria a preferência com os mesmos dados usados no exemplo em Python
        $preference = $client->create([
            "items" => [
                [
                    "id" => "1",
                    "title" => "Camisa",
                    "quantity" => 1,
                    "currency_id" => "BRL",
                    "unit_price" => 259.99
                ]
            ],
            "back_urls" => [
                "success" => "http://127.0.0.1:8000/compracerta.html", // Crie esta página em HTML 
                "failure" => "http://127.0.0.1:8000/compraerrada.html", // Crie esta página em HTML
                "pending" => "http://127.0.0.1:8000/compraerrada.html",
            ],
            "auto_return" => "all"
        ]);

        // Retorna o link que vai iniciar o fluxo de pagamento do Mercado Pago
        return $preference->init_point;

    } catch (\Exception $e) {
        // Se houver algum erro na criação da preferência
        return "#erro_api:_" . $e->getMessage();
    }
}

// 4. Recebemos o link do init_point
$link_pagamento = gerar_link_pagamento();

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integração Mercado Pago - PHP</title>
</head>
<body>
    <h1>Ecommerce Teste (PHP)</h1>
    <p>Camisa</p>
    <p>Preço: R$ 259,99</p>
    
    <!-- Link recebe o valor gerado na função PHP -->
    <?php if (strpos($link_pagamento, '#erro_api') !== false): ?>
        <p style="color: red;">Ocorreu um erro ao gerar o pagamento. Verifique seu Access Token.</p>
        <p><?php echo $link_pagamento; ?></p>
    <?php else: ?>
        <a href="<?php echo $link_pagamento; ?>">Compre aqui</a>
    <?php endif; ?>

</body>
</html>

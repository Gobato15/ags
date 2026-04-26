<?php
/**
 * API DE PAGAMENTO - AGS DELIVERY
 * Interface genérica para integração de pagamentos e Webhooks (Avisos de Pagamento).
 * Pode ser conectada futuramente a provedores como Asaas, PagSeguro, Stripe, etc.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Arquivo local para armazenar o estado das transações (banco de dados temporário)
$dbFile = __DIR__ . '/payments.json';

// Inicializa o arquivo se não existir
if (!file_exists($dbFile)) {
    file_put_contents($dbFile, json_encode([]));
}

$action = $_GET['action'] ?? '';

// Função auxiliar para ler pagamentos
function readPayments() {
    global $dbFile;
    $data = file_get_contents($dbFile);
    return json_decode($data, true) ?: [];
}

// Função auxiliar para salvar pagamentos
function savePayments($payments) {
    global $dbFile;
    file_put_contents($dbFile, json_encode($payments, JSON_PRETTY_PRINT));
}

// Roteamento da API
switch ($action) {
    /**
     * 1. GERAR PAGAMENTO
     * Recebe os dados do pedido do frontend e gera uma intenção de pagamento.
     */
    case 'create':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $total = $input['total'] ?? 0;
        $customerName = $input['customerName'] ?? 'Cliente';
        
        if ($total <= 0) {
            echo json_encode(['error' => 'Valor inválido']);
            http_response_code(400);
            exit;
        }

        // Gera um ID único para a transação
        $transactionId = uniqid('txn_');
        
        // Aqui você integraria com a API real (ex: gerando Payload PIX)
        // Para a interface genérica, criamos um PIX Cópia e Cola simulado/genérico
        $pixCopiaCola = "00020126580014br.gov.bcb.pix0136...PIX_GENERICO...5204000053039865404" . number_format($total, 2, '.', '') . "5802BR5925" . strtoupper(substr($customerName, 0, 20)) . "6009SAO PAULO62070503***6304E2D1";

        $paymentData = [
            'id' => $transactionId,
            'status' => 'pending', // pending, approved, rejected
            'total' => $total,
            'customer' => $customerName,
            'created_at' => date('Y-m-d H:i:s')
        ];

        // Salva no "banco de dados"
        $payments = readPayments();
        $payments[$transactionId] = $paymentData;
        savePayments($payments);

        echo json_encode([
            'success' => true,
            'transactionId' => $transactionId,
            'pixCopiaCola' => $pixCopiaCola,
            'message' => 'Pagamento gerado com sucesso aguardando confirmação.'
        ]);
        break;

    /**
     * 2. VERIFICAR STATUS (Polling pelo Frontend)
     * O frontend chama essa rota a cada X segundos para ver se o pagamento foi pago.
     */
    case 'status':
        $transactionId = $_GET['id'] ?? '';
        
        if (empty($transactionId)) {
            echo json_encode(['error' => 'ID de transação não informado']);
            http_response_code(400);
            exit;
        }

        $payments = readPayments();
        if (!isset($payments[$transactionId])) {
            echo json_encode(['error' => 'Transação não encontrada']);
            http_response_code(404);
            exit;
        }

        echo json_encode([
            'id' => $transactionId,
            'status' => $payments[$transactionId]['status']
        ]);
        break;

    /**
     * 3. WEBHOOK (Aviso de Pagamento)
     * Rota chamada silenciosamente pelo provedor de pagamento (Asaas, PagSeguro, etc)
     * quando o cliente finaliza o pagamento no aplicativo do banco dele.
     */
    case 'webhook':
        // Recebe o Payload do provedor
        $payload = json_decode(file_get_contents('php://input'), true);
        
        // Em um caso real, o ID da transação e o status vêm do payload
        $transactionId = $payload['id'] ?? $_GET['id'] ?? '';
        $newStatus = $payload['status'] ?? 'approved'; // Assumimos aprovação para teste

        // Validação de segurança real ocorreria aqui (ex: checar assinatura/token do provedor)
        
        if (empty($transactionId)) {
            echo json_encode(['error' => 'ID ausente no webhook']);
            http_response_code(400);
            exit;
        }

        $payments = readPayments();
        if (isset($payments[$transactionId])) {
            // Atualiza o status
            $payments[$transactionId]['status'] = $newStatus;
            $payments[$transactionId]['paid_at'] = date('Y-m-d H:i:s');
            savePayments($payments);

            // Aqui você poderia colocar a "Liberação do Produto" no Backend
            // Exemplo: Disparar um e-mail para a cozinha, atualizar ERP, etc.
            // liberaçãoProdutoInterna($transactionId);

            echo json_encode(['success' => true, 'message' => 'Webhook processado, status atualizado para ' . $newStatus]);
        } else {
            echo json_encode(['error' => 'Transação não encontrada para atualizar']);
            http_response_code(404);
        }
        break;

    /**
     * 4. ROTA DE TESTE (Apenas para desenvolvimento)
     * Aprova manualmente um pagamento para testar a liberação no frontend.
     */
    case 'simulate_approve':
        $transactionId = $_GET['id'] ?? '';
        $payments = readPayments();
        if (isset($payments[$transactionId])) {
            $payments[$transactionId]['status'] = 'approved';
            savePayments($payments);
            echo "Pagamento {$transactionId} aprovado com sucesso! Volte ao frontend.";
        } else {
            echo "Transação não encontrada.";
        }
        break;

    default:
        echo json_encode(['error' => 'Ação inválida']);
        http_response_code(400);
        break;
}

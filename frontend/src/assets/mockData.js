// Auto-generated mock data for offline/fallback analysis
export const mockBlueprints = {
  "ecommerce": {
    "system_name": "ecommerce",
    "entry_nodes": [
      "api-gateway"
    ],
    "traffic_profile": "steady",
    "nodes": [
      {
        "id": "api-gateway",
        "label": "API Gateway",
        "type": "service",
        "nominal_latency_ms": 10,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "auth-service",
        "label": "Auth Service",
        "type": "service",
        "nominal_latency_ms": 30,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 2,
        "circuit_breaker": true,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "orders-service",
        "label": "Orders Service",
        "type": "service",
        "nominal_latency_ms": 50,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "payment-service",
        "label": "Payment Service",
        "type": "service",
        "nominal_latency_ms": 150,
        "baseline_failure_probability": 0.01,
        "timeout_ms": 3000,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "inventory-service",
        "label": "Inventory Service",
        "type": "service",
        "nominal_latency_ms": 40,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 2,
        "circuit_breaker": true,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.6
      },
      {
        "id": "cart-service",
        "label": "Cart Service",
        "type": "service",
        "nominal_latency_ms": 25,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "pricing-service",
        "label": "Pricing Service",
        "type": "service",
        "nominal_latency_ms": 20,
        "baseline_failure_probability": 0,
        "timeout_ms": 500,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.4
      },
      {
        "id": "orders-db",
        "label": "Orders Database",
        "type": "database",
        "nominal_latency_ms": 30,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "inventory-db",
        "label": "Inventory Database",
        "type": "database",
        "nominal_latency_ms": 20,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.6
      },
      {
        "id": "payment-db",
        "label": "Payment Database",
        "type": "database",
        "nominal_latency_ms": 40,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "notification-queue",
        "label": "Notification Queue",
        "type": "queue",
        "nominal_latency_ms": 5,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.3
      },
      {
        "id": "email-service",
        "label": "Email Service",
        "type": "service",
        "nominal_latency_ms": 80,
        "baseline_failure_probability": 0.02,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.2
      },
      {
        "id": "analytics-service",
        "label": "Analytics Service",
        "type": "service",
        "nominal_latency_ms": 100,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.3
      },
      {
        "id": "search-service",
        "label": "Search Service",
        "type": "service",
        "nominal_latency_ms": 60,
        "baseline_failure_probability": 0,
        "timeout_ms": 1500,
        "retries": 1,
        "circuit_breaker": true,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.5
      }
    ],
    "edges": [
      {
        "from": "api-gateway",
        "to": "auth-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "api-gateway",
        "to": "orders-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "api-gateway",
        "to": "cart-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "api-gateway",
        "to": "search-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "orders-service",
        "to": "payment-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "orders-service",
        "to": "inventory-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "orders-service",
        "to": "orders-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "orders-service",
        "to": "notification-queue",
        "protocol": "amqp",
        "sync": false
      },
      {
        "from": "orders-service",
        "to": "analytics-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "payment-service",
        "to": "payment-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "payment-service",
        "to": "pricing-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "inventory-service",
        "to": "inventory-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "cart-service",
        "to": "orders-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "cart-service",
        "to": "pricing-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "analytics-service",
        "to": "orders-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "notification-queue",
        "to": "email-service",
        "protocol": "amqp",
        "sync": false
      }
    ]
  },
  "ridesharing": {
    "system_name": "ridesharing",
    "entry_nodes": [
      "passenger-api",
      "driver-api"
    ],
    "traffic_profile": "steady",
    "nodes": [
      {
        "id": "passenger-api",
        "label": "Passenger API",
        "type": "service",
        "nominal_latency_ms": 15,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "driver-api",
        "label": "Driver API",
        "type": "service",
        "nominal_latency_ms": 15,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "matching-service",
        "label": "Matching Service",
        "type": "service",
        "nominal_latency_ms": 100,
        "baseline_failure_probability": 0,
        "timeout_ms": 3000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "dispatch-service",
        "label": "Dispatch Service",
        "type": "service",
        "nominal_latency_ms": 80,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "routing-service",
        "label": "Routing Service",
        "type": "service",
        "nominal_latency_ms": 60,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "tracking-service",
        "label": "Tracking Service",
        "type": "service",
        "nominal_latency_ms": 50,
        "baseline_failure_probability": 0.01,
        "timeout_ms": 1500,
        "retries": 1,
        "circuit_breaker": true,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.6
      },
      {
        "id": "location-db",
        "label": "Location Database",
        "type": "database",
        "nominal_latency_ms": 30,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "billing-service",
        "label": "Billing Service",
        "type": "service",
        "nominal_latency_ms": 70,
        "baseline_failure_probability": 0.01,
        "timeout_ms": 2000,
        "retries": 2,
        "circuit_breaker": true,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "notification-service",
        "label": "Notification Service",
        "type": "service",
        "nominal_latency_ms": 50,
        "baseline_failure_probability": 0.02,
        "timeout_ms": 1500,
        "retries": 1,
        "circuit_breaker": true,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.4
      },
      {
        "id": "driver-notify-service",
        "label": "Driver Notify Service",
        "type": "service",
        "nominal_latency_ms": 30,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.5
      },
      {
        "id": "sms-gateway",
        "label": "SMS Gateway",
        "type": "service",
        "nominal_latency_ms": 200,
        "baseline_failure_probability": 0.03,
        "timeout_ms": 2000,
        "retries": 2,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.3
      },
      {
        "id": "email-service",
        "label": "Email Service",
        "type": "service",
        "nominal_latency_ms": 80,
        "baseline_failure_probability": 0.02,
        "timeout_ms": 1500,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.2
      }
    ],
    "edges": [
      {
        "from": "passenger-api",
        "to": "matching-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "driver-api",
        "to": "matching-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "matching-service",
        "to": "dispatch-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "dispatch-service",
        "to": "routing-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "routing-service",
        "to": "location-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "tracking-service",
        "to": "location-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "dispatch-service",
        "to": "location-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "passenger-api",
        "to": "tracking-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "passenger-api",
        "to": "billing-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "dispatch-service",
        "to": "driver-notify-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "driver-notify-service",
        "to": "sms-gateway",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "driver-notify-service",
        "to": "email-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "driver-notify-service",
        "to": "driver-api",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "driver-notify-service",
        "to": "notification-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "driver-notify-service",
        "to": "billing-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "driver-notify-service",
        "to": "matching-service",
        "protocol": "http",
        "sync": false
      }
    ]
  },
  "banking": {
    "system_name": "banking",
    "entry_nodes": [
      "mobile-api",
      "web-api"
    ],
    "traffic_profile": "steady",
    "nodes": [
      {
        "id": "mobile-api",
        "label": "Mobile API Gateway",
        "type": "service",
        "nominal_latency_ms": 10,
        "baseline_failure_probability": 0,
        "timeout_ms": 1500,
        "retries": 3,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "web-api",
        "label": "Web API Gateway",
        "type": "service",
        "nominal_latency_ms": 10,
        "baseline_failure_probability": 0,
        "timeout_ms": 1500,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "api-gateway",
        "label": "Internal API Gateway",
        "type": "service",
        "nominal_latency_ms": 15,
        "baseline_failure_probability": 0,
        "timeout_ms": 1500,
        "retries": 3,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "auth-service",
        "label": "Auth Service",
        "type": "service",
        "nominal_latency_ms": 40,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 1,
        "circuit_breaker": true,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "transaction-service",
        "label": "Transaction Service",
        "type": "service",
        "nominal_latency_ms": 80,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 3,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "fraud-service",
        "label": "Fraud Detection Service",
        "type": "service",
        "nominal_latency_ms": 120,
        "baseline_failure_probability": 0.01,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "compliance-service",
        "label": "Compliance Service",
        "type": "service",
        "nominal_latency_ms": 90,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 1,
        "circuit_breaker": true,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "notification-service",
        "label": "Notification Service",
        "type": "service",
        "nominal_latency_ms": 50,
        "baseline_failure_probability": 0.02,
        "timeout_ms": 1500,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.3
      },
      {
        "id": "ledger-db",
        "label": "Ledger Database",
        "type": "database",
        "nominal_latency_ms": 20,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "audit-db",
        "label": "Audit Database",
        "type": "database",
        "nominal_latency_ms": 25,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.7
      },
      {
        "id": "user-db",
        "label": "User Database",
        "type": "database",
        "nominal_latency_ms": 20,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.6
      },
      {
        "id": "transaction-db",
        "label": "Transaction Database",
        "type": "database",
        "nominal_latency_ms": 30,
        "baseline_failure_probability": 0,
        "timeout_ms": 1000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 2,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "payment-processor",
        "label": "Payment Processor",
        "type": "service",
        "nominal_latency_ms": 200,
        "baseline_failure_probability": 0.05,
        "timeout_ms": 3000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 1
      },
      {
        "id": "risk-engine",
        "label": "Risk Engine",
        "type": "service",
        "nominal_latency_ms": 110,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 1,
        "circuit_breaker": true,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.9
      },
      {
        "id": "reporting-service",
        "label": "Reporting Service",
        "type": "service",
        "nominal_latency_ms": 150,
        "baseline_failure_probability": 0,
        "timeout_ms": 3000,
        "retries": 1,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.4
      },
      {
        "id": "archive-service",
        "label": "Archive Service",
        "type": "service",
        "nominal_latency_ms": 100,
        "baseline_failure_probability": 0,
        "timeout_ms": 2000,
        "retries": 0,
        "circuit_breaker": false,
        "replicas": 1,
        "has_dlq": false,
        "declared_criticality": 0.2
      }
    ],
    "edges": [
      {
        "from": "mobile-api",
        "to": "api-gateway",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "web-api",
        "to": "api-gateway",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "api-gateway",
        "to": "auth-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "api-gateway",
        "to": "transaction-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "auth-service",
        "to": "user-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "payment-processor",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "fraud-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "compliance-service",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "risk-engine",
        "protocol": "http",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "transaction-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "ledger-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "transaction-service",
        "to": "notification-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "fraud-service",
        "to": "transaction-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "compliance-service",
        "to": "transaction-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "compliance-service",
        "to": "audit-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "compliance-service",
        "to": "archive-service",
        "protocol": "http",
        "sync": false
      },
      {
        "from": "risk-engine",
        "to": "transaction-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "risk-engine",
        "to": "ledger-db",
        "protocol": "tcp",
        "sync": true
      },
      {
        "from": "reporting-service",
        "to": "audit-db",
        "protocol": "tcp",
        "sync": true
      }
    ]
  }
};

export const mockReports = {
  "ecommerce": {
    "used_fallback": true,
    "provider": "deterministic",
    "resilience_score": 57,
    "confidence": 80,
    "score_breakdown": [
      {
        "finding_id": "F2",
        "scenario": "latency_adversary_payment-service",
        "title": "Resilience bottleneck at payment-service under latency_adversary_payment-service",
        "severity": 0.2025,
        "blast_radius": 0.5714,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0289,
        "affected_nodes": [
          "api-gateway",
          "cart-service",
          "inventory-db",
          "inventory-service",
          "notification-queue",
          "orders-db",
          "orders-service",
          "payment-service"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "payment-service",
            "affected_node": "payment-service",
            "failure_type": "latency",
            "impact_score": 0.23333333333333334
          },
          {
            "tick": 20,
            "source_node": "orders-db",
            "affected_node": "orders-db",
            "failure_type": "degraded",
            "impact_score": 0.2346368715083799
          },
          {
            "tick": 20,
            "source_node": "inventory-db",
            "affected_node": "inventory-db",
            "failure_type": "degraded",
            "impact_score": 0.5775401069518716
          },
          {
            "tick": 21,
            "source_node": "inventory-db",
            "affected_node": "inventory-service",
            "failure_type": "upstream_timeout",
            "impact_score": 0.3130434782608696
          },
          {
            "tick": 21,
            "source_node": "payment-service",
            "affected_node": "orders-service",
            "failure_type": "upstream_timeout",
            "impact_score": 0.2403846153846154
          },
          {
            "tick": 21,
            "source_node": "orders-db",
            "affected_node": "cart-service",
            "failure_type": "upstream_timeout",
            "impact_score": 0.26582278481012656
          },
          {
            "tick": 22,
            "source_node": "orders-service",
            "affected_node": "api-gateway",
            "failure_type": "upstream_timeout",
            "impact_score": 0.4423076923076923
          },
          {
            "tick": 37,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 37,
            "source_node": "notification-queue",
            "affected_node": "notification-queue",
            "failure_type": "queue_overflow",
            "impact_score": 1
          },
          {
            "tick": 38,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 39,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 40,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 41,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 42,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 43,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 44,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 45,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 46,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 47,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 48,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 49,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 50,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 51,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 52,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 53,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 54,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 55,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 56,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 57,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 58,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 59,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 60,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 61,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 64,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 93,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 94,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'payment-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "add_circuit_breaker",
        "patch_params": {
          "node_id": "payment-service",
          "changes": {
            "circuit_breaker": true
          }
        }
      },
      {
        "finding_id": "F1",
        "scenario": "latency_adversary_orders-service",
        "title": "Resilience bottleneck at orders-service under latency_adversary_orders-service",
        "severity": 0.1021,
        "blast_radius": 0.2143,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0038,
        "affected_nodes": [
          "api-gateway",
          "notification-queue",
          "orders-service"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "orders-service",
            "affected_node": "orders-service",
            "failure_type": "latency",
            "impact_score": 0.21153846153846154
          },
          {
            "tick": 21,
            "source_node": "orders-service",
            "affected_node": "api-gateway",
            "failure_type": "upstream_timeout",
            "impact_score": 0.22115384615384615
          },
          {
            "tick": 37,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 37,
            "source_node": "notification-queue",
            "affected_node": "notification-queue",
            "failure_type": "queue_overflow",
            "impact_score": 1
          },
          {
            "tick": 38,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 39,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 40,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 41,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 42,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 43,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 44,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 45,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 46,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 47,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 48,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 49,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 50,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 51,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 52,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 53,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 54,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 55,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 56,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 57,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 58,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 59,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 60,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 61,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 64,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 93,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 94,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'orders-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "add_circuit_breaker",
        "patch_params": {
          "node_id": "orders-service",
          "changes": {
            "circuit_breaker": true
          }
        }
      },
      {
        "finding_id": "F3",
        "scenario": "compound_latency_retry_storm_orders-service",
        "title": "Resilience bottleneck at orders-service under compound_latency_retry_storm_orders-service",
        "severity": 0.1045,
        "blast_radius": 0.2143,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0002,
        "affected_nodes": [
          "api-gateway",
          "notification-queue",
          "orders-service"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "orders-service",
            "affected_node": "orders-service",
            "failure_type": "latency",
            "impact_score": 0.21153846153846154
          },
          {
            "tick": 21,
            "source_node": "orders-service",
            "affected_node": "api-gateway",
            "failure_type": "upstream_timeout",
            "impact_score": 0.22115384615384615
          },
          {
            "tick": 37,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 37,
            "source_node": "notification-queue",
            "affected_node": "notification-queue",
            "failure_type": "queue_overflow",
            "impact_score": 1
          },
          {
            "tick": 38,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 39,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 40,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 41,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 42,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 43,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 44,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 45,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 46,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 47,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 48,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 49,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 50,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 51,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 52,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 53,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 54,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 55,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 56,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 57,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 58,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 59,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 60,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 61,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 62,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 63,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 64,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 65,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 93,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          },
          {
            "tick": 94,
            "source_node": "orders-service",
            "affected_node": "notification-queue",
            "failure_type": "QUEUE_OVERFLOW_DROP",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'orders-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "adjust_retries",
        "patch_params": {
          "node_id": "orders-service",
          "changes": {
            "retries": 1
          }
        }
      }
    ],
    "overall_summary": "Deterministic Fallback: System resilience analysis complete. Main stability bottlenecks exist in synchronous dependency paths and un-isolated databases, leading to high failure propagation rates.",
    "logs": [
      {
        "agent": "Security Sanitizer",
        "status": "running",
        "message": "Sanitizing system blueprint, filtering potentially unsafe prompts..."
      },
      {
        "agent": "Security Sanitizer",
        "status": "complete",
        "message": "Input sanitized successfully. Checked 14 nodes and 16 edges. No injection signatures found."
      },
      {
        "agent": "Topology Agent",
        "status": "running",
        "message": "Calculating betweenness centrality and synchronicity graphs..."
      },
      {
        "agent": "Topology Agent",
        "status": "complete",
        "message": "Topology mapped: 14 nodes, 16 edges (synchronous: 13). Mapped centralities."
      },
      {
        "agent": "Orchestrator Agent",
        "status": "running",
        "message": "Planning optimal perturbation sequences based on node priority scores..."
      },
      {
        "agent": "Orchestrator Agent",
        "status": "fallback",
        "message": "Adaptive planning failed or timed out. Loaded deterministic fallback test schedule."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'payment-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 57.1%. Impact: 2.9%."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'orders-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 21.4%. Impact: 0.4%."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'orders-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 21.4%. Impact: 0.0%."
      },
      {
        "agent": "Health Monitor Agent",
        "status": "error",
        "message": "Network jitter spike detected during simulation. Swarm self-recovered."
      },
      {
        "agent": "Cascade Analyzer Agent",
        "status": "running",
        "message": "Aggregating scenario simulation logs and computing overall resilience..."
      },
      {
        "agent": "Cascade Analyzer Agent",
        "status": "complete",
        "message": "Analysis complete. Resilience Score: 57/100. Confidence: 80%."
      }
    ]
  },
  "ridesharing": {
    "used_fallback": true,
    "provider": "deterministic",
    "resilience_score": 35,
    "confidence": 80,
    "score_breakdown": [
      {
        "finding_id": "F4",
        "scenario": "compound_latency_retry_storm_matching-service",
        "title": "Resilience bottleneck at matching-service under compound_latency_retry_storm_matching-service",
        "severity": 0.4201,
        "blast_radius": 0.5,
        "likelihood": 0.5,
        "likelihood_breakdown": "retries=0 (+0.25) + circuit_breaker=false (+0.25)",
        "impact": 0.105,
        "affected_nodes": [
          "dispatch-service",
          "driver-api",
          "location-db",
          "matching-service",
          "passenger-api",
          "routing-service"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "location-db",
            "affected_node": "location-db",
            "failure_type": "degraded",
            "impact_score": 1
          },
          {
            "tick": 20,
            "source_node": "matching-service",
            "affected_node": "matching-service",
            "failure_type": "latency",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "location-db",
            "affected_node": "routing-service",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "location-db",
            "affected_node": "dispatch-service",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "matching-service",
            "affected_node": "passenger-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "matching-service",
            "affected_node": "driver-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'matching-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "adjust_retries",
        "patch_params": {
          "node_id": "matching-service",
          "changes": {
            "retries": 1
          }
        }
      },
      {
        "finding_id": "F1",
        "scenario": "latency_adversary_matching-service",
        "title": "Resilience bottleneck at matching-service under latency_adversary_matching-service",
        "severity": 0.4097,
        "blast_radius": 0.5,
        "likelihood": 0.5,
        "likelihood_breakdown": "retries=0 (+0.25) + circuit_breaker=false (+0.25)",
        "impact": 0.0717,
        "affected_nodes": [
          "dispatch-service",
          "driver-api",
          "location-db",
          "matching-service",
          "passenger-api",
          "routing-service"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "location-db",
            "affected_node": "location-db",
            "failure_type": "degraded",
            "impact_score": 1
          },
          {
            "tick": 20,
            "source_node": "matching-service",
            "affected_node": "matching-service",
            "failure_type": "latency",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "location-db",
            "affected_node": "routing-service",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "location-db",
            "affected_node": "dispatch-service",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "matching-service",
            "affected_node": "passenger-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "matching-service",
            "affected_node": "driver-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'matching-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "add_circuit_breaker",
        "patch_params": {
          "node_id": "matching-service",
          "changes": {
            "circuit_breaker": true
          }
        }
      },
      {
        "finding_id": "F2",
        "scenario": "latency_adversary_dispatch-service",
        "title": "Resilience bottleneck at dispatch-service under latency_adversary_dispatch-service",
        "severity": 0.2078,
        "blast_radius": 0.3333,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0121,
        "affected_nodes": [
          "dispatch-service",
          "driver-api",
          "matching-service",
          "passenger-api"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "dispatch-service",
            "affected_node": "dispatch-service",
            "failure_type": "latency",
            "impact_score": 0.27884615384615385
          },
          {
            "tick": 21,
            "source_node": "dispatch-service",
            "affected_node": "matching-service",
            "failure_type": "upstream_timeout",
            "impact_score": 0.5576923076923077
          },
          {
            "tick": 22,
            "source_node": "matching-service",
            "affected_node": "passenger-api",
            "failure_type": "upstream_timeout",
            "impact_score": 0.5
          },
          {
            "tick": 22,
            "source_node": "matching-service",
            "affected_node": "driver-api",
            "failure_type": "upstream_timeout",
            "impact_score": 0.6153846153846154
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'dispatch-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "add_circuit_breaker",
        "patch_params": {
          "node_id": "dispatch-service",
          "changes": {
            "circuit_breaker": true
          }
        }
      },
      {
        "finding_id": "F3",
        "scenario": "latency_adversary_driver-notify-service",
        "title": "Resilience bottleneck at driver-notify-service under latency_adversary_driver-notify-service",
        "severity": 0,
        "blast_radius": 0.0833,
        "likelihood": 0.5,
        "likelihood_breakdown": "retries=0 (+0.25) + circuit_breaker=false (+0.25)",
        "impact": 0,
        "affected_nodes": [
          "driver-notify-service"
        ],
        "cascade_tree": [],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'driver-notify-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "add_circuit_breaker",
        "patch_params": {
          "node_id": "driver-notify-service",
          "changes": {
            "circuit_breaker": true
          }
        }
      }
    ],
    "overall_summary": "Deterministic Fallback: System resilience analysis complete. Main stability bottlenecks exist in synchronous dependency paths and un-isolated databases, leading to high failure propagation rates.",
    "logs": [
      {
        "agent": "Security Sanitizer",
        "status": "running",
        "message": "Sanitizing system blueprint, filtering potentially unsafe prompts..."
      },
      {
        "agent": "Security Sanitizer",
        "status": "complete",
        "message": "Input sanitized successfully. Checked 12 nodes and 16 edges. No injection signatures found."
      },
      {
        "agent": "Topology Agent",
        "status": "running",
        "message": "Calculating betweenness centrality and synchronicity graphs..."
      },
      {
        "agent": "Topology Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Topology mapped: 12 nodes, 16 edges (synchronous: 9). Mapped centralities."
      },
      {
        "agent": "Orchestrator Agent",
        "status": "running",
        "message": "Planning optimal perturbation sequences based on node priority scores..."
      },
      {
        "agent": "Orchestrator Agent",
        "status": "fallback",
        "provider": "deterministic",
        "message": "Adaptive planning failed or timed out. Loaded deterministic fallback test schedule."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'matching-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 50.0%. Impact: 10.5%."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'matching-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 50.0%. Impact: 7.2%."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'dispatch-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 33.3%. Impact: 1.2%."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'driver-notify-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 8.3%. Impact: 0.0%."
      },
      {
        "agent": "Health Monitor Agent",
        "status": "error",
        "message": "Network jitter spike detected during simulation. Swarm self-recovered."
      },
      {
        "agent": "Cascade Analyzer Agent",
        "status": "running",
        "message": "Aggregating scenario simulation logs and computing overall resilience..."
      },
      {
        "agent": "Cascade Analyzer Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Analysis complete. Resilience Score: 35/100. Confidence: 80%."
      }
    ]
  },
  "banking": {
    "used_fallback": true,
    "provider": "deterministic",
    "resilience_score": 35,
    "confidence": 80,
    "score_breakdown": [
      {
        "finding_id": "F4",
        "scenario": "compound_latency_retry_storm_transaction-service",
        "title": "Resilience bottleneck at transaction-service under compound_latency_retry_storm_transaction-service",
        "severity": 0.4607,
        "blast_radius": 0.4375,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0504,
        "affected_nodes": [
          "api-gateway",
          "fraud-service",
          "mobile-api",
          "payment-processor",
          "transaction-db",
          "transaction-service",
          "web-api"
        ],
        "cascade_tree": [
          {
            "tick": 20,
            "source_node": "transaction-db",
            "affected_node": "transaction-db",
            "failure_type": "degraded",
            "impact_score": 1
          },
          {
            "tick": 20,
            "source_node": "transaction-service",
            "affected_node": "transaction-service",
            "failure_type": "latency",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "transaction-db",
            "affected_node": "fraud-service",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 21,
            "source_node": "transaction-service",
            "affected_node": "api-gateway",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 22,
            "source_node": "api-gateway",
            "affected_node": "mobile-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 22,
            "source_node": "api-gateway",
            "affected_node": "web-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 25,
            "source_node": "payment-processor",
            "affected_node": "payment-processor",
            "failure_type": "degraded",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'transaction-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "adjust_retries",
        "patch_params": {
          "node_id": "transaction-service",
          "changes": {
            "retries": 1
          }
        }
      },
      {
        "finding_id": "F1",
        "scenario": "retry_storm_transaction-service",
        "title": "Resilience bottleneck at transaction-service under retry_storm_transaction-service",
        "severity": 0.4103,
        "blast_radius": 0.3125,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0224,
        "affected_nodes": [
          "api-gateway",
          "mobile-api",
          "payment-processor",
          "transaction-service",
          "web-api"
        ],
        "cascade_tree": [
          {
            "tick": 25,
            "source_node": "payment-processor",
            "affected_node": "payment-processor",
            "failure_type": "degraded",
            "impact_score": 1
          },
          {
            "tick": 25,
            "source_node": "transaction-service",
            "affected_node": "transaction-service",
            "failure_type": "latency",
            "impact_score": 1
          },
          {
            "tick": 26,
            "source_node": "transaction-service",
            "affected_node": "api-gateway",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 27,
            "source_node": "api-gateway",
            "affected_node": "mobile-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 27,
            "source_node": "api-gateway",
            "affected_node": "web-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'transaction-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "adjust_retries",
        "patch_params": {
          "node_id": "transaction-service",
          "changes": {
            "retries": 1
          }
        }
      },
      {
        "finding_id": "F2",
        "scenario": "retry_storm_api-gateway",
        "title": "Resilience bottleneck at api-gateway under retry_storm_api-gateway",
        "severity": 0.0874,
        "blast_radius": 0.125,
        "likelihood": 0.25,
        "likelihood_breakdown": "circuit_breaker=false (+0.25)",
        "impact": 0.0019,
        "affected_nodes": [
          "api-gateway",
          "web-api"
        ],
        "cascade_tree": [
          {
            "tick": 25,
            "source_node": "web-api",
            "affected_node": "web-api",
            "failure_type": "degraded",
            "impact_score": 0.34375
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'api-gateway' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "adjust_retries",
        "patch_params": {
          "node_id": "api-gateway",
          "changes": {
            "retries": 1
          }
        }
      },
      {
        "finding_id": "F3",
        "scenario": "retry_storm_compliance-service",
        "title": "Resilience bottleneck at compliance-service under retry_storm_compliance-service",
        "severity": 0.4499,
        "blast_radius": 0.375,
        "likelihood": 0.1,
        "likelihood_breakdown": "default baseline (+0.10)",
        "impact": 0.0006,
        "affected_nodes": [
          "api-gateway",
          "compliance-service",
          "mobile-api",
          "transaction-db",
          "transaction-service",
          "web-api"
        ],
        "cascade_tree": [
          {
            "tick": 25,
            "source_node": "transaction-db",
            "affected_node": "transaction-db",
            "failure_type": "degraded",
            "impact_score": 0.6648658547752038
          },
          {
            "tick": 25,
            "source_node": "compliance-service",
            "affected_node": "compliance-service",
            "failure_type": "latency",
            "impact_score": 1
          },
          {
            "tick": 26,
            "source_node": "compliance-service",
            "affected_node": "transaction-service",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 27,
            "source_node": "transaction-service",
            "affected_node": "api-gateway",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 28,
            "source_node": "api-gateway",
            "affected_node": "mobile-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          },
          {
            "tick": 28,
            "source_node": "api-gateway",
            "affected_node": "web-api",
            "failure_type": "upstream_timeout",
            "impact_score": 1
          }
        ],
        "remediation_text": "Deterministic Fallback: Address vulnerabilities on target node 'compliance-service' by deploying a resilient circuit breaker configuration and adjusting retries to prevent cascading latency storms across dependencies.",
        "patch_template": "adjust_retries",
        "patch_params": {
          "node_id": "compliance-service",
          "changes": {
            "retries": 1
          }
        }
      }
    ],
    "overall_summary": "Deterministic Fallback: System resilience analysis complete. Main stability bottlenecks exist in synchronous dependency paths and un-isolated databases, leading to high failure propagation rates.",
    "logs": [
      {
        "agent": "Security Sanitizer",
        "status": "running",
        "message": "Sanitizing system blueprint, filtering potentially unsafe prompts..."
      },
      {
        "agent": "Security Sanitizer",
        "status": "complete",
        "message": "Input sanitized successfully. Checked 16 nodes and 19 edges. No injection signatures found."
      },
      {
        "agent": "Topology Agent",
        "status": "running",
        "message": "Calculating betweenness centrality and synchronicity graphs..."
      },
      {
        "agent": "Topology Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Topology mapped: 16 nodes, 19 edges (synchronous: 17). Mapped centralities."
      },
      {
        "agent": "Orchestrator Agent",
        "status": "running",
        "message": "Planning optimal perturbation sequences based on node priority scores..."
      },
      {
        "agent": "Orchestrator Agent",
        "status": "fallback",
        "provider": "deterministic",
        "message": "Adaptive planning failed or timed out. Loaded deterministic fallback test schedule."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "running",
        "message": "Simulating latency spike on target node 'transaction-service'..."
      },
      {
        "agent": "Latency Adversary Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Latency spike simulated. Upstream timeouts cascade. Blast radius: 43.8%. Impact: 5.0%."
      },
      {
        "agent": "Retry Storm Agent",
        "status": "running",
        "message": "Simulating retry storm amplification on 'transaction-service'..."
      },
      {
        "agent": "Retry Storm Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Amplification factor 9x detected upstream of transaction-service (3 retries x 3 retries). 847 effective requests hit the failing node."
      },
      {
        "agent": "Retry Storm Agent",
        "status": "running",
        "message": "Simulating retry storm amplification on 'api-gateway'..."
      },
      {
        "agent": "Retry Storm Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Amplification factor 9x detected upstream of api-gateway (3 retries x 3 retries). 847 effective requests hit the failing node."
      },
      {
        "agent": "Retry Storm Agent",
        "status": "running",
        "message": "Simulating retry storm amplification on 'compliance-service'..."
      },
      {
        "agent": "Retry Storm Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Amplification factor 9x detected upstream of compliance-service (3 retries x 3 retries). 847 effective requests hit the failing node."
      },
      {
        "agent": "Health Monitor Agent",
        "status": "error",
        "message": "Network jitter spike detected during simulation. Swarm self-recovered."
      },
      {
        "agent": "Cascade Analyzer Agent",
        "status": "running",
        "message": "Aggregating scenario simulation logs and computing overall resilience..."
      },
      {
        "agent": "Cascade Analyzer Agent",
        "status": "complete",
        "provider": "deterministic",
        "message": "Analysis complete. Resilience Score: 35/100. Confidence: 80%."
      }
    ]
  }
};

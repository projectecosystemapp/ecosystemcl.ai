resource "aws_lambda_function" "forge_execute" {
  filename         = "forge-execute.zip"
  function_name    = "${var.app_name}-${var.environment}-forge-execute"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 300

  environment {
    variables = {
      USER_POOL_ID = var.user_pool_id
      DYNAMODB_TABLES = jsonencode(var.dynamodb_tables)
    }
  }
}

resource "aws_lambda_function" "post_confirmation" {
  filename         = "post-confirmation.zip"
  function_name    = "${var.app_name}-${var.environment}-post-confirmation"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.app_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_api_gateway_rest_api" "main" {
  name = "${var.app_name}-${var.environment}-api"
}

resource "aws_api_gateway_resource" "forge" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "forge"
}

resource "aws_api_gateway_method" "forge_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.forge.id
  http_method   = "POST"
  authorization = "NONE"
}

# Add OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "forge_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.forge.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# CORS Integration for OPTIONS
resource "aws_api_gateway_integration" "forge_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.forge.id
  http_method = aws_api_gateway_method.forge_options.http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# CORS Method Response for OPTIONS
resource "aws_api_gateway_method_response" "forge_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.forge.id
  http_method = aws_api_gateway_method.forge_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# CORS Integration Response for OPTIONS
resource "aws_api_gateway_integration_response" "forge_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.forge.id
  http_method = aws_api_gateway_method.forge_options.http_method
  status_code = aws_api_gateway_method_response.forge_options.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Add CORS to POST method response
resource "aws_api_gateway_method_response" "forge_post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.forge.id
  http_method = aws_api_gateway_method.forge_post.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "forge_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.forge.id
  http_method = aws_api_gateway_method.forge_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.forge_execute.invoke_arn
}

# Add integration response for CORS on POST
resource "aws_api_gateway_integration_response" "forge_post" {
  depends_on = [aws_api_gateway_integration.forge_integration]
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.forge.id
  http_method = aws_api_gateway_method.forge_post.http_method
  status_code = aws_api_gateway_method_response.forge_post.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.forge_execute.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.forge_integration,
    aws_api_gateway_integration.forge_options
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
  
  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}
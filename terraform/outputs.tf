output "cognito_user_pool_id" {
  value = module.auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.auth.user_pool_client_id
}

output "cognito_identity_pool_id" {
  value = module.auth.identity_pool_id
}

output "cognito_user_pool_domain" {
  value = module.auth.user_pool_domain
}

output "api_gateway_url" {
  value = module.compute.api_gateway_url
}

output "s3_bucket_name" {
  value = module.storage.bucket_name
}

output "region" {
  value = var.aws_region
}

output "app_name" {
  value = var.app_name
}

output "environment" {
  value = var.environment
}
output "cognito_user_pool_id" {
  value = module.auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.auth.user_pool_client_id
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
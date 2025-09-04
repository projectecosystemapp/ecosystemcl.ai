variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "dynamodb_tables" {
  description = "DynamoDB table names"
  type        = map(string)
}